package com.onwax.controller;

import com.onwax.dto.NowPlayingDto;
import com.onwax.dto.SessionDto;
import com.onwax.service.SessionService;
import com.onwax.service.SpotifyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final SpotifyService spotifyService;

    public SessionController(SessionService sessionService, SpotifyService spotifyService) {
        this.sessionService = sessionService;
        this.spotifyService = spotifyService;
    }

    @PostMapping
    public ResponseEntity<?> createSession(@AuthenticationPrincipal String spotifyUserId) {
        Optional<NowPlayingDto> nowPlaying = spotifyService.getNowPlaying(spotifyUserId);
        if (nowPlaying.isEmpty()) {
            return ResponseEntity.badRequest().body("No active Spotify playback detected");
        }

        SessionDto created = sessionService.createSession(spotifyUserId, nowPlaying.get());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/active")
    public ResponseEntity<SessionDto> getActiveSession(@AuthenticationPrincipal String spotifyUserId) {
        return sessionService.getActiveSession(spotifyUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping
    public ResponseEntity<List<SessionDto>> getAllSessions(@AuthenticationPrincipal String spotifyUserId) {
        return ResponseEntity.ok(sessionService.getAllSessions(spotifyUserId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionDto> getSessionById(@PathVariable Long id,
                                                     @AuthenticationPrincipal String spotifyUserId) {
        return sessionService.getSessionById(id, spotifyUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<SessionDto> abandonSession(@PathVariable Long id,
                                                     @AuthenticationPrincipal String spotifyUserId) {
        SessionDto abandoned = sessionService.abandonSession(id, spotifyUserId);
        return ResponseEntity.ok(abandoned);
    }
}
