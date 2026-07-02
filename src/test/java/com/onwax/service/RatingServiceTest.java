package com.onwax.service;

import com.onwax.dto.TrackRatingDto;
import com.onwax.entity.ListeningSession;
import com.onwax.entity.TrackRating;
import com.onwax.repository.RatingRepository;
import com.onwax.repository.SessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RatingServiceTest {

    private SessionRepository sessionRepo;
    private RatingRepository ratingRepo;
    private SessionService sessionService;
    private RatingService service;

    @BeforeEach
    void setUp() {
        sessionRepo = mock(SessionRepository.class);
        ratingRepo = mock(RatingRepository.class);
        sessionService = mock(SessionService.class);
        service = new RatingService(sessionRepo, ratingRepo);
        // save() echoes back the entity it was given
        when(ratingRepo.save(any(TrackRating.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private ListeningSession inProgressSession() {
        ListeningSession s = new ListeningSession();
        s.setId(1L);
        s.setStatus("IN_PROGRESS");
        s.setTotalTracks(10);
        return s;
    }

    @Test
    void updatesExistingRowRatherThanInsertingDuplicate() {
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(inProgressSession()));
        TrackRating existing = new TrackRating();
        existing.setId(99L);
        when(ratingRepo.findBySessionIdAndSpotifyTrackId(1L, "trk")).thenReturn(Optional.of(existing));

        service.submitRating(1L, "trk", "Song", 1, 1, 9, false, "great", sessionService);

        ArgumentCaptor<TrackRating> captor = ArgumentCaptor.forClass(TrackRating.class);
        verify(ratingRepo).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(99L); // same row, not a new one
        assertThat(captor.getValue().getRating()).isEqualTo(9);
    }

    @Test
    void createsNewRowWhenNoneExists() {
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(inProgressSession()));
        when(ratingRepo.findBySessionIdAndSpotifyTrackId(1L, "trk")).thenReturn(Optional.empty());

        TrackRatingDto dto = service.submitRating(1L, "trk", "Song", 2, 1, 6, false, null, sessionService);

        ArgumentCaptor<TrackRating> captor = ArgumentCaptor.forClass(TrackRating.class);
        verify(ratingRepo).save(captor.capture());
        assertThat(captor.getValue().getId()).isNull(); // new entity
        assertThat(captor.getValue().getSpotifyTrackId()).isEqualTo("trk");
        assertThat(dto.rating()).isEqualTo(6);
    }

    @Test
    void triggersCompletionCheckAfterSaving() {
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(inProgressSession()));
        when(ratingRepo.findBySessionIdAndSpotifyTrackId(1L, "trk")).thenReturn(Optional.empty());

        service.submitRating(1L, "trk", "Song", 1, 1, 8, false, null, sessionService);

        verify(sessionService).completeIfFinished(1L);
    }

    @Test
    void rejectsRatingForMissingSession() {
        when(sessionRepo.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                service.submitRating(1L, "trk", "Song", 1, 1, 8, false, null, sessionService))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsRatingWhenSessionNotInProgress() {
        ListeningSession completed = inProgressSession();
        completed.setStatus("COMPLETED");
        when(sessionRepo.findById(1L)).thenReturn(Optional.of(completed));

        assertThatThrownBy(() ->
                service.submitRating(1L, "trk", "Song", 1, 1, 8, false, null, sessionService))
                .isInstanceOf(IllegalStateException.class);
    }
}
