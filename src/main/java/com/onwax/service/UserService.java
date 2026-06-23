package com.onwax.service;

import com.onwax.dto.ProfileDto;
import com.onwax.entity.User;
import com.onwax.repository.FollowRepository;
import com.onwax.repository.SessionRepository;
import com.onwax.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserService {

    private static final int MAX_USERNAME_LENGTH = 30;

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final SessionRepository sessionRepository;

    public UserService(UserRepository userRepository, FollowRepository followRepository,
                       SessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public User upsertFromSpotify(String spotifyUserId, String displayName, String avatarUrl) {
        User user = userRepository.findBySpotifyUserId(spotifyUserId).orElseGet(User::new);
        boolean isNew = user.getId() == null;

        user.setSpotifyUserId(spotifyUserId);
        if (displayName != null) {
            user.setDisplayName(displayName);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }
        if (isNew) {
            user.setUsername(generateUniqueUsername(displayName != null ? displayName : spotifyUserId));
            user.setCreatedAt(LocalDateTime.now());
        }

        return userRepository.save(user);
    }

    public Optional<ProfileDto> getProfileBySpotifyUserId(String spotifyUserId) {
        return userRepository.findBySpotifyUserId(spotifyUserId)
                .map(u -> toProfileDto(u, null));
    }

    public Optional<ProfileDto> getProfileByUsername(String username, Long viewerUserId) {
        return userRepository.findByUsername(username)
                .map(u -> toProfileDto(u, viewerUserId));
    }

    public Optional<Long> getUserIdBySpotifyUserId(String spotifyUserId) {
        return userRepository.findBySpotifyUserId(spotifyUserId).map(User::getId);
    }

    private ProfileDto toProfileDto(User user, Long viewerUserId) {
        long followersCount = followRepository.countByFollowedId(user.getId());
        long followingCount = followRepository.countByFollowerId(user.getId());
        long sessionCount = sessionRepository.countByUserIdAndStatus(user.getId(), "COMPLETED");
        Boolean isFollowing = (viewerUserId != null && !viewerUserId.equals(user.getId()))
                ? followRepository.existsByFollowerIdAndFollowedId(viewerUserId, user.getId())
                : null;
        return new ProfileDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getCreatedAt(),
                followersCount,
                followingCount,
                sessionCount,
                isFollowing
        );
    }

    private String generateUniqueUsername(String base) {
        String slug = slugify(base);
        if (slug.isEmpty()) {
            slug = "listener";
        }

        String candidate = slug;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = slug + suffix;
            suffix++;
        }
        return candidate;
    }

    private String slugify(String input) {
        String slug = input.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+)|(-+$)", "");
        if (slug.length() > MAX_USERNAME_LENGTH) {
            slug = slug.substring(0, MAX_USERNAME_LENGTH).replaceAll("-+$", "");
        }
        return slug;
    }
}
