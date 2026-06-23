package com.onwax.service;

import com.onwax.entity.ListeningSession;
import com.onwax.entity.User;
import com.onwax.repository.BadgeRepository;
import com.onwax.repository.SessionRepository;
import com.onwax.repository.UserBadgeRepository;
import com.onwax.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end badge engine test against a real Postgres (Testcontainers), driving the
 * production {@link RatingService#submitRating} path. Verifies thresholds, the
 * skips-don't-count SQL, and per-album idempotency including the unique constraint.
 */
@SpringBootTest
@Testcontainers
class BadgeEngineIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired private RatingService ratingService;
    @Autowired private UserRepository userRepository;
    @Autowired private SessionRepository sessionRepository;
    @Autowired private UserBadgeRepository userBadgeRepository;
    @Autowired private BadgeRepository badgeRepository;

    private static final AtomicLong COUNTER = new AtomicLong();

    private User newUser() {
        long n = COUNTER.incrementAndGet();
        User u = new User();
        u.setSpotifyUserId("spotify-" + n);
        u.setUsername("user-" + n);
        u.setCreatedAt(LocalDateTime.now());
        return userRepository.save(u);
    }

    private ListeningSession newSession(User user, int totalTracks) {
        ListeningSession s = new ListeningSession();
        s.setSpotifyUserId(user.getSpotifyUserId());
        s.setUserId(user.getId());
        s.setSpotifyAlbumId("album-" + user.getId());
        s.setAlbumName("Test Album");
        s.setAlbumArtist("Test Artist");
        s.setTotalTracks(totalTracks);
        s.setStatus("IN_PROGRESS");
        s.setStartedAt(LocalDateTime.now());
        return sessionRepository.save(s);
    }

    private void score(Long sessionId, int trackNumber, int rating) {
        ratingService.submitRating(sessionId, "track-" + trackNumber, "Track " + trackNumber,
                trackNumber, 1, rating, false, null);
    }

    private void skip(Long sessionId, int trackNumber) {
        ratingService.submitRating(sessionId, "track-" + trackNumber, "Track " + trackNumber,
                trackNumber, 1, null, true, null);
    }

    private long badgeCount(Long userId, String code) {
        Long badgeId = badgeRepository.findByCode(code).orElseThrow().getId();
        return userBadgeRepository.findByUserIdOrderByEarnedAtDesc(userId).stream()
                .filter(ub -> ub.getBadgeId().equals(badgeId))
                .count();
    }

    @Test
    void awardsHalfThenFull_andIsIdempotent() {
        User user = newUser();
        ListeningSession session = newSession(user, 4);
        Long sid = session.getId();

        score(sid, 1, 8);
        assertThat(badgeCount(user.getId(), "HALF_ALBUM")).isZero();

        score(sid, 2, 7);
        assertThat(badgeCount(user.getId(), "HALF_ALBUM")).isEqualTo(1);
        assertThat(badgeCount(user.getId(), "FULL_ALBUM")).isZero();

        // Re-rating the same track must not create a duplicate HALF badge.
        score(sid, 2, 9);
        assertThat(badgeCount(user.getId(), "HALF_ALBUM")).isEqualTo(1);

        score(sid, 3, 6);
        assertThat(badgeCount(user.getId(), "FULL_ALBUM")).isZero();

        score(sid, 4, 5);
        assertThat(badgeCount(user.getId(), "FULL_ALBUM")).isEqualTo(1);
        assertThat(badgeCount(user.getId(), "HALF_ALBUM")).isEqualTo(1);
    }

    @Test
    void skippedTracksDoNotCountTowardFull() {
        User user = newUser();
        ListeningSession session = newSession(user, 4);
        Long sid = session.getId();

        score(sid, 1, 8);
        score(sid, 2, 7);   // 2 scored of 4 -> HALF
        skip(sid, 3);
        skip(sid, 4);       // session now has 4 ratings (completes), but only 2 are scored

        assertThat(badgeCount(user.getId(), "HALF_ALBUM")).isEqualTo(1);
        assertThat(badgeCount(user.getId(), "FULL_ALBUM")).isZero();
    }
}
