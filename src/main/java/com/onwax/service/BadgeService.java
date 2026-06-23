package com.onwax.service;

import com.onwax.dto.EarnedBadgeDto;
import com.onwax.entity.Badge;
import com.onwax.entity.ListeningSession;
import com.onwax.entity.User;
import com.onwax.entity.UserBadge;
import com.onwax.repository.BadgeRepository;
import com.onwax.repository.RatingRepository;
import com.onwax.repository.UserBadgeRepository;
import com.onwax.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class BadgeService {

    private static final Logger log = LoggerFactory.getLogger(BadgeService.class);

    private static final String HALF_ALBUM = "HALF_ALBUM";
    private static final String FULL_ALBUM = "FULL_ALBUM";

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    public BadgeService(BadgeRepository badgeRepository,
                        UserBadgeRepository userBadgeRepository,
                        RatingRepository ratingRepository,
                        UserRepository userRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
    }

    /**
     * Evaluate album-completion badges for a session against its current scored-track count.
     * Progress is measured within the session; awards are deduped per (user, badge, album).
     * Never throws into the caller — a badge failure must not break rating submission.
     */
    public void evaluate(ListeningSession session) {
        try {
            int total = session.getTotalTracks();
            if (total <= 0) {
                return;
            }

            long scored = ratingRepository.countScoredBySessionId(session.getId());

            if (scored * 2 >= total) {
                award(session, HALF_ALBUM);
            }
            if (scored >= total) {
                award(session, FULL_ALBUM);
            }
        } catch (Exception e) {
            log.warn("Badge evaluation failed for session {}", session.getId(), e);
        }
    }

    private void award(ListeningSession session, String badgeCode) {
        Badge badge = badgeRepository.findByCode(badgeCode).orElse(null);
        if (badge == null) {
            log.warn("Badge definition missing for code {}", badgeCode);
            return;
        }

        Long userId = session.getUserId();
        String albumId = session.getSpotifyAlbumId();
        if (userBadgeRepository.existsByUserIdAndBadgeIdAndSpotifyAlbumId(userId, badge.getId(), albumId)) {
            return;
        }

        UserBadge userBadge = new UserBadge();
        userBadge.setUserId(userId);
        userBadge.setBadgeId(badge.getId());
        userBadge.setSpotifyAlbumId(albumId);
        userBadge.setEarnedAt(LocalDateTime.now());

        try {
            userBadgeRepository.save(userBadge);
        } catch (DataIntegrityViolationException e) {
            // Concurrent submit already awarded this (user, badge, album); the unique
            // constraint makes the duplicate harmless.
            log.debug("Badge {} already awarded for user {} album {}", badgeCode, userId, albumId);
        }
    }

    public List<EarnedBadgeDto> getEarnedBadgesByUsername(String username) {
        return toEarnedBadges(userRepository.findByUsername(username).orElse(null));
    }

    public List<EarnedBadgeDto> getEarnedBadgesBySpotifyUserId(String spotifyUserId) {
        return toEarnedBadges(userRepository.findBySpotifyUserId(spotifyUserId).orElse(null));
    }

    private List<EarnedBadgeDto> toEarnedBadges(User user) {
        if (user == null) {
            return List.of();
        }

        Map<Long, Badge> badgesById = badgeRepository.findAll().stream()
                .collect(Collectors.toMap(Badge::getId, Function.identity()));

        return userBadgeRepository.findByUserIdOrderByEarnedAtDesc(user.getId()).stream()
                .map(ub -> {
                    Badge badge = badgesById.get(ub.getBadgeId());
                    return new EarnedBadgeDto(
                            badge != null ? badge.getCode() : null,
                            badge != null ? badge.getName() : null,
                            badge != null ? badge.getDescription() : null,
                            ub.getSpotifyAlbumId(),
                            ub.getEarnedAt()
                    );
                })
                .toList();
    }
}
