package com.onwax.controller;

import com.onwax.dto.NowPlayingDto;
import com.onwax.service.SpotifyService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spotify")
public class SpotifyController {

    private final SpotifyService spotifyService;

    public SpotifyController(SpotifyService spotifyService) {
        this.spotifyService = spotifyService;
    }

    @GetMapping("/login")
    public ResponseEntity<Void> login() {
        String authUrl = spotifyService.getAuthorizationUrl();
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, authUrl)
                .build();
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam String code, HttpSession session) {
        String spotifyUserId = spotifyService.exchangeCodeForTokens(code);
        session.setAttribute("spotifyUserId", spotifyUserId);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, "http://127.0.0.1:5173")
                .build();
    }

    @GetMapping("/logout")
    public ResponseEntity<Void> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/now-playing")
    public ResponseEntity<NowPlayingDto> nowPlaying(HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return spotifyService.getNowPlaying(spotifyUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }
}
