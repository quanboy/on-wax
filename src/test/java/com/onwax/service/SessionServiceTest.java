package com.onwax.service;

import com.onwax.entity.ListeningSession;
import com.onwax.entity.TrackRating;
import com.onwax.repository.RatingRepository;
import com.onwax.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionServiceTest {

    private SessionRepository sessionRepo;
    private RatingRepository ratingRepo;
    private SessionService service;

    @BeforeEach
    void setUp() {
        sessionRepo = mock(SessionRepository.class);
        ratingRepo = mock(RatingRepository.class);
        service = new SessionService(sessionRepo, ratingRepo);
    }

    private ListeningSession inProgress(long id, int totalTracks) {
        ListeningSession s = new ListeningSession();
        s.setId(id);
        s.setStatus("IN_PROGRESS");
        s.setTotalTracks(totalTracks);
        return s;
    }

    private TrackRating rating(Integer score, boolean skipped) {
        TrackRating r = new TrackRating();
        r.setRating(score);
        r.setSkipped(skipped);
        return r;
    }

    @Test
    void doesNotCompleteUntilEveryTrackHasARow() {
        ListeningSession s = inProgress(1L, 3);
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(s));
        when(ratingRepo.findBySessionId(1L)).thenReturn(List.of(rating(8, false))); // 1 of 3

        service.completeIfFinished(1L);

        assertThat(s.getStatus()).isEqualTo("IN_PROGRESS");
        verify(sessionRepo, never()).save(any());
    }

    @Test
    void completesAndAveragesOnlyNonSkippedTracks() {
        ListeningSession s = inProgress(1L, 3);
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(s));
        when(ratingRepo.findBySessionId(1L)).thenReturn(List.of(
                rating(8, false), rating(7, false), rating(null, true)));

        service.completeIfFinished(1L);

        assertThat(s.getStatus()).isEqualTo("COMPLETED");
        assertThat(s.getCompletedAt()).isNotNull();
        assertThat(s.getFinalScore()).isEqualByComparingTo(new BigDecimal("7.50")); // (8+7)/2
        verify(sessionRepo).save(s);
    }

    @Test
    void roundsScoreHalfUpToTwoDecimals() {
        ListeningSession s = inProgress(1L, 3);
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(s));
        when(ratingRepo.findBySessionId(1L)).thenReturn(List.of(
                rating(8, false), rating(8, false), rating(7, false)));

        service.completeIfFinished(1L);

        assertThat(s.getFinalScore()).isEqualByComparingTo(new BigDecimal("7.67")); // 23/3 = 7.666..
    }

    @Test
    void completesWithNullScoreWhenAllTracksSkipped() {
        ListeningSession s = inProgress(1L, 2);
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(s));
        when(ratingRepo.findBySessionId(1L)).thenReturn(List.of(
                rating(null, true), rating(null, true)));

        service.completeIfFinished(1L);

        assertThat(s.getStatus()).isEqualTo("COMPLETED");
        assertThat(s.getFinalScore()).isNull();
    }

    @Test
    void ignoresSessionsThatAreNotInProgress() {
        ListeningSession s = inProgress(1L, 1);
        s.setStatus("COMPLETED");
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(s));

        service.completeIfFinished(1L);

        verify(sessionRepo, never()).save(any());
    }
}
