package com.onwax.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onwax.config.SpotifyProperties;
import com.onwax.dto.NowPlayingDto;
import com.onwax.entity.SpotifyToken;
import com.onwax.entity.User;
import com.onwax.repository.SpotifyTokenRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
public class SpotifyService {

    private final SpotifyTokenRepository spotifyTokenRepository;
    private final SpotifyProperties spotifyProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final UserService userService;

    public SpotifyService(SpotifyTokenRepository spotifyTokenRepository,
                          SpotifyProperties spotifyProperties,
                          RestTemplate restTemplate,
                          ObjectMapper objectMapper,
                          UserService userService) {
        this.spotifyTokenRepository = spotifyTokenRepository;
        this.spotifyProperties = spotifyProperties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.userService = userService;
    }

    public String getAuthorizationUrl() {
        String encodedRedirectUri = URLEncoder.encode(spotifyProperties.getRedirectUri(), StandardCharsets.UTF_8);
        return "https://accounts.spotify.com/authorize"
                + "?response_type=code"
                + "&client_id=" + spotifyProperties.getClientId()
                + "&scope=" + URLEncoder.encode("user-read-currently-playing user-read-playback-state", StandardCharsets.UTF_8)
                + "&redirect_uri=" + encodedRedirectUri;
    }

    public String exchangeCodeForTokens(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + encodeCredentials());

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("code", code);
        body.add("redirect_uri", spotifyProperties.getRedirectUri());

        try {
            ResponseEntity<String> tokenResponse = restTemplate.exchange(
                    "https://accounts.spotify.com/api/token",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class);

            JsonNode tokenJson = objectMapper.readTree(tokenResponse.getBody());
            String accessToken = tokenJson.get("access_token").asText();
            String refreshToken = tokenJson.get("refresh_token").asText();
            int expiresIn = tokenJson.get("expires_in").asInt();

            // Get the user's Spotify ID
            HttpHeaders meHeaders = new HttpHeaders();
            meHeaders.setBearerAuth(accessToken);
            ResponseEntity<String> meResponse = restTemplate.exchange(
                    "https://api.spotify.com/v1/me",
                    HttpMethod.GET,
                    new HttpEntity<>(meHeaders),
                    String.class);

            JsonNode meJson = objectMapper.readTree(meResponse.getBody());
            String spotifyUserId = meJson.get("id").asText();

            JsonNode displayNameNode = meJson.get("display_name");
            String displayName = (displayNameNode != null && !displayNameNode.isNull())
                    ? displayNameNode.asText() : null;

            JsonNode meImages = meJson.get("images");
            String avatarUrl = (meImages != null && meImages.isArray() && !meImages.isEmpty())
                    ? meImages.get(0).get("url").asText() : null;

            // Create/update the local user before saving the token so we can link them.
            User user = userService.upsertFromSpotify(spotifyUserId, displayName, avatarUrl);

            LocalDateTime now = LocalDateTime.now();
            SpotifyToken token = spotifyTokenRepository.findBySpotifyUserId(spotifyUserId)
                    .orElse(new SpotifyToken());

            token.setSpotifyUserId(spotifyUserId);
            token.setUserId(user.getId());
            token.setAccessToken(accessToken);
            token.setRefreshToken(refreshToken);
            token.setExpiresAt(now.plusSeconds(expiresIn));
            if (token.getCreatedAt() == null) {
                token.setCreatedAt(now);
            }
            token.setUpdatedAt(now);

            spotifyTokenRepository.save(token);

            return spotifyUserId;
        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange code for tokens", e);
        }
    }

    public String getValidAccessToken(String spotifyUserId) {
        SpotifyToken token = spotifyTokenRepository.findBySpotifyUserId(spotifyUserId)
                .orElseThrow(() -> new RuntimeException("No token found for user: " + spotifyUserId));

        if (token.getExpiresAt().isAfter(LocalDateTime.now().plusSeconds(60))) {
            return token.getAccessToken();
        }

        // Refresh the token
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + encodeCredentials());

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "refresh_token");
        body.add("refresh_token", token.getRefreshToken());

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://accounts.spotify.com/api/token",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    String.class);

            JsonNode json = objectMapper.readTree(response.getBody());
            String newAccessToken = json.get("access_token").asText();
            int expiresIn = json.get("expires_in").asInt();

            token.setAccessToken(newAccessToken);
            token.setExpiresAt(LocalDateTime.now().plusSeconds(expiresIn));
            token.setUpdatedAt(LocalDateTime.now());
            spotifyTokenRepository.save(token);

            return newAccessToken;
        } catch (Exception e) {
            throw new RuntimeException("Failed to refresh token", e);
        }
    }

    public Optional<NowPlayingDto> getNowPlaying(String spotifyUserId) {
        String accessToken = getValidAccessToken(spotifyUserId);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.spotify.com/v1/me/player/currently-playing",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class);

            if (response.getStatusCode().value() == 204 || response.getBody() == null) {
                return Optional.empty();
            }

            JsonNode json = objectMapper.readTree(response.getBody());

            if (!json.has("is_playing") || !json.get("is_playing").asBoolean()) {
                return Optional.empty();
            }

            JsonNode item = json.get("item");
            if (item == null || item.isNull()) {
                return Optional.empty();
            }
            JsonNode album = item.get("album");
            if (album == null || album.isNull()) {
                return Optional.empty();
            }

            JsonNode artists = album.get("artists");
            String albumArtist = (artists != null && artists.isArray() && !artists.isEmpty())
                    ? artists.get(0).get("name").asText() : "Unknown Artist";

            JsonNode images = album.get("images");
            String albumArtUrl = (images != null && images.isArray() && !images.isEmpty())
                    ? images.get(0).get("url").asText() : null;

            NowPlayingDto dto = new NowPlayingDto(
                    item.get("id").asText(),
                    item.get("name").asText(),
                    item.get("track_number").asInt(),
                    item.get("disc_number").asInt(),
                    album.get("id").asText(),
                    album.get("name").asText(),
                    albumArtist,
                    albumArtUrl,
                    album.get("total_tracks").asInt(),
                    json.get("is_playing").asBoolean()
            );

            return Optional.of(dto);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get now playing", e);
        }
    }

    private String encodeCredentials() {
        String credentials = spotifyProperties.getClientId() + ":" + spotifyProperties.getClientSecret();
        return Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }
}
