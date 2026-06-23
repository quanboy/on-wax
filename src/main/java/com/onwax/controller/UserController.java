package com.onwax.controller;

import com.onwax.dto.EarnedBadgeDto;
import com.onwax.dto.ProfileDto;
import com.onwax.service.BadgeService;
import com.onwax.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final BadgeService badgeService;

    public UserController(UserService userService, BadgeService badgeService) {
        this.userService = userService;
        this.badgeService = badgeService;
    }

    @GetMapping("/me")
    public ResponseEntity<ProfileDto> me(HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return userService.getProfileBySpotifyUserId(spotifyUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me/badges")
    public ResponseEntity<List<EarnedBadgeDto>> myBadges(HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(badgeService.getEarnedBadgesBySpotifyUserId(spotifyUserId));
    }

    @GetMapping("/{username}")
    public ResponseEntity<ProfileDto> byUsername(@PathVariable String username) {
        return userService.getProfileByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{username}/badges")
    public ResponseEntity<List<EarnedBadgeDto>> badgesByUsername(@PathVariable String username) {
        return ResponseEntity.ok(badgeService.getEarnedBadgesByUsername(username));
    }
}
