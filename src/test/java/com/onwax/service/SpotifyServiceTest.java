package com.onwax.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onwax.config.SpotifyProperties;
import com.onwax.entity.SpotifyToken;
import com.onwax.exception.SpotifyAuthException;
import com.onwax.repository.SpotifyTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class SpotifyServiceTest {

    private static final String TOKEN_URL = "https://accounts.spotify.com/api/token";

    private SpotifyTokenRepository tokenRepo;
    private RestTemplate restTemplate;
    private SpotifyService service;

    @BeforeEach
    void setUp() {
        tokenRepo = mock(SpotifyTokenRepository.class);
        restTemplate = mock(RestTemplate.class);
        SpotifyProperties props = new SpotifyProperties();
        props.setClientId("client-id");
        props.setClientSecret("client-secret");
        props.setRedirectUri("http://127.0.0.1:8080/spotify/callback");
        service = new SpotifyService(tokenRepo, props, restTemplate, new ObjectMapper(), mock(UserService.class));
    }

    private SpotifyToken tokenExpiringAt(LocalDateTime expiresAt) {
        SpotifyToken t = new SpotifyToken();
        t.setSpotifyUserId("user1");
        t.setAccessToken("old-access");
        t.setRefreshToken("old-refresh");
        t.setExpiresAt(expiresAt);
        t.setCreatedAt(LocalDateTime.now());
        t.setUpdatedAt(LocalDateTime.now());
        return t;
    }

    @Test
    void returnsExistingTokenWhenNotExpired() {
        SpotifyToken token = tokenExpiringAt(LocalDateTime.now().plusHours(1));
        when(tokenRepo.findBySpotifyUserId("user1")).thenReturn(Optional.of(token));

        String result = service.getValidAccessToken("user1");

        assertThat(result).isEqualTo("old-access");
        verifyNoInteractions(restTemplate);
        verify(tokenRepo, never()).save(any());
    }

    @Test
    void refreshesWhenExpiredAndPersistsNewAccessToken() {
        SpotifyToken token = tokenExpiringAt(LocalDateTime.now().minusMinutes(1));
        when(tokenRepo.findBySpotifyUserId("user1")).thenReturn(Optional.of(token));
        when(restTemplate.exchange(eq(TOKEN_URL), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok("{\"access_token\":\"new-access\",\"expires_in\":3600}"));

        String result = service.getValidAccessToken("user1");

        assertThat(result).isEqualTo("new-access");
        assertThat(token.getAccessToken()).isEqualTo("new-access");
        assertThat(token.getRefreshToken()).isEqualTo("old-refresh"); // not rotated -> unchanged
        assertThat(token.getExpiresAt()).isAfter(LocalDateTime.now().plusSeconds(3000));
        verify(tokenRepo).save(token);
    }

    @Test
    void persistsRotatedRefreshTokenWhenSpotifyReturnsOne() {
        SpotifyToken token = tokenExpiringAt(LocalDateTime.now().minusMinutes(1));
        when(tokenRepo.findBySpotifyUserId("user1")).thenReturn(Optional.of(token));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(ResponseEntity.ok(
                        "{\"access_token\":\"new-access\",\"expires_in\":3600,\"refresh_token\":\"new-refresh\"}"));

        service.getValidAccessToken("user1");

        assertThat(token.getRefreshToken()).isEqualTo("new-refresh");
    }

    @Test
    void throwsSpotifyAuthExceptionWhenRefreshFails() {
        SpotifyToken token = tokenExpiringAt(LocalDateTime.now().minusMinutes(1));
        when(tokenRepo.findBySpotifyUserId("user1")).thenReturn(Optional.of(token));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RuntimeException("401 Unauthorized from Spotify"));

        assertThatThrownBy(() -> service.getValidAccessToken("user1"))
                .isInstanceOf(SpotifyAuthException.class);
    }

    @Test
    void throwsSpotifyAuthExceptionWhenNoTokenForUser() {
        when(tokenRepo.findBySpotifyUserId("user1")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getValidAccessToken("user1"))
                .isInstanceOf(SpotifyAuthException.class);
    }
}
