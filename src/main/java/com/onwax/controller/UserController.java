package com.onwax.controller;

import com.onwax.dto.EarnedBadgeDto;
import com.onwax.dto.ProfileDto;
import com.onwax.dto.UpdateProfileRequest;
import com.onwax.service.BadgeService;
import com.onwax.service.FollowService;
import com.onwax.service.UserService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final BadgeService badgeService;
    private final FollowService followService;

    public UserController(UserService userService, BadgeService badgeService, FollowService followService) {
        this.userService = userService;
        this.badgeService = badgeService;
        this.followService = followService;
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

    @PatchMapping("/me")
    public ResponseEntity<ProfileDto> updateMe(@Valid @RequestBody UpdateProfileRequest request,
                                               HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            return ResponseEntity.ok(userService.updateProfile(spotifyUserId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
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
    public ResponseEntity<ProfileDto> byUsername(@PathVariable String username, HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        Long viewerUserId = spotifyUserId != null
                ? userService.getUserIdBySpotifyUserId(spotifyUserId).orElse(null)
                : null;
        return userService.getProfileByUsername(username, viewerUserId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{username}/badges")
    public ResponseEntity<List<EarnedBadgeDto>> badgesByUsername(@PathVariable String username) {
        return ResponseEntity.ok(badgeService.getEarnedBadgesByUsername(username));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<ProfileDto>> followers(@PathVariable String username, HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        Long viewerUserId = spotifyUserId != null
                ? userService.getUserIdBySpotifyUserId(spotifyUserId).orElse(null)
                : null;
        List<ProfileDto> result = followService.getFollowers(username).stream()
                .map(u -> userService.getProfileByUsername(u.getUsername(), viewerUserId).orElseThrow())
                .toList();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<ProfileDto>> following(@PathVariable String username, HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        Long viewerUserId = spotifyUserId != null
                ? userService.getUserIdBySpotifyUserId(spotifyUserId).orElse(null)
                : null;
        List<ProfileDto> result = followService.getFollowing(username).stream()
                .map(u -> userService.getProfileByUsername(u.getUsername(), viewerUserId).orElseThrow())
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<Void> follow(@PathVariable String username, HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        followService.follow(spotifyUserId, username);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{username}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable String username, HttpSession session) {
        String spotifyUserId = (String) session.getAttribute("spotifyUserId");
        if (spotifyUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        followService.unfollow(spotifyUserId, username);
        return ResponseEntity.ok().build();
    }
}
