package com.onwax.service;

import com.onwax.entity.Badge;
import com.onwax.entity.ListeningSession;
import com.onwax.entity.UserBadge;
import com.onwax.repository.BadgeRepository;
import com.onwax.repository.RatingRepository;
import com.onwax.repository.UserBadgeRepository;
import com.onwax.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the badge award logic: thresholds, full-implies-half, and idempotency.
 * The scored-track count is mocked here; the SQL that excludes skips is covered by
 * {@link BadgeEngineIntegrationTest} against a real database.
 */
@ExtendWith(MockitoExtension.class)
class BadgeServiceTest {

    private static final long HALF_BADGE_ID = 10L;
    private static final long FULL_BADGE_ID = 20L;

    @Mock private BadgeRepository badgeRepository;
    @Mock private UserBadgeRepository userBadgeRepository;
    @Mock private RatingRepository ratingRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private BadgeService badgeService;

    private ListeningSession session(int totalTracks) {
        ListeningSession s = new ListeningSession();
        s.setId(1L);
        s.setUserId(7L);
        s.setSpotifyAlbumId("album123");
        s.setTotalTracks(totalTracks);
        return s;
    }

    private void stubScored(long scored) {
        when(ratingRepository.countScoredBySessionId(1L)).thenReturn(scored);
    }

    private void stubBadge(String code, long id) {
        Badge badge = new Badge();
        badge.setId(id);
        badge.setCode(code);
        when(badgeRepository.findByCode(code)).thenReturn(Optional.of(badge));
        when(userBadgeRepository.existsByUserIdAndBadgeIdAndSpotifyAlbumId(7L, id, "album123"))
                .thenReturn(false);
    }

    @Test
    void belowHalf_awardsNothing() {
        stubScored(1); // 1 of 4

        badgeService.evaluate(session(4));

        verify(badgeRepository, never()).findByCode(anyString());
        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void exactlyHalf_awardsHalfOnly() {
        stubScored(2); // 2 of 4 == 50%
        stubBadge("HALF_ALBUM", HALF_BADGE_ID);

        badgeService.evaluate(session(4));

        ArgumentCaptor<UserBadge> captor = ArgumentCaptor.forClass(UserBadge.class);
        verify(userBadgeRepository).save(captor.capture());
        assertThat(captor.getValue().getBadgeId()).isEqualTo(HALF_BADGE_ID);
        assertThat(captor.getValue().getUserId()).isEqualTo(7L);
        assertThat(captor.getValue().getSpotifyAlbumId()).isEqualTo("album123");
        verify(badgeRepository, never()).findByCode("FULL_ALBUM");
    }

    @Test
    void fullAlbum_awardsBothHalfAndFull() {
        stubScored(4); // 4 of 4
        stubBadge("HALF_ALBUM", HALF_BADGE_ID);
        stubBadge("FULL_ALBUM", FULL_BADGE_ID);

        badgeService.evaluate(session(4));

        verify(userBadgeRepository, times(2)).save(any());
        verify(badgeRepository).findByCode("HALF_ALBUM");
        verify(badgeRepository).findByCode("FULL_ALBUM");
    }

    @Test
    void oddTotal_needsStrictMajorityForHalf() {
        stubScored(2); // 2 of 5 == 40%, below half

        badgeService.evaluate(session(5));

        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void oddTotal_halfAwardedOnceMajorityReached() {
        stubScored(3); // 3 of 5 == 60%
        stubBadge("HALF_ALBUM", HALF_BADGE_ID);

        badgeService.evaluate(session(5));

        verify(userBadgeRepository).save(any());
        verify(badgeRepository, never()).findByCode("FULL_ALBUM");
    }

    @Test
    void alreadyEarned_doesNotAwardAgain() {
        stubScored(2);
        Badge badge = new Badge();
        badge.setId(HALF_BADGE_ID);
        badge.setCode("HALF_ALBUM");
        when(badgeRepository.findByCode("HALF_ALBUM")).thenReturn(Optional.of(badge));
        when(userBadgeRepository.existsByUserIdAndBadgeIdAndSpotifyAlbumId(7L, HALF_BADGE_ID, "album123"))
                .thenReturn(true);

        badgeService.evaluate(session(4));

        verify(userBadgeRepository, never()).save(any());
    }

    @Test
    void zeroTotalTracks_isNoOp() {
        badgeService.evaluate(session(0));

        verifyNoInteractions(badgeRepository, userBadgeRepository);
        verify(ratingRepository, never()).countScoredBySessionId(anyLong());
    }

    @Test
    void missingBadgeDefinition_doesNotThrow() {
        stubScored(2);
        when(badgeRepository.findByCode("HALF_ALBUM")).thenReturn(Optional.empty());

        badgeService.evaluate(session(4)); // must not throw

        verify(userBadgeRepository, never()).save(any());
        verify(badgeRepository, never()).findByCode(eq("FULL_ALBUM"));
    }
}
