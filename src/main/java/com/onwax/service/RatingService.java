package com.onwax.service;

import com.onwax.dto.TrackRatingDto;
import com.onwax.entity.ListeningSession;
import com.onwax.entity.TrackRating;
import com.onwax.repository.RatingRepository;
import com.onwax.repository.SessionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class RatingService {

    private final SessionRepository sessionRepository;
    private final RatingRepository ratingRepository;

    public RatingService(SessionRepository sessionRepository, RatingRepository ratingRepository) {
        this.sessionRepository = sessionRepository;
        this.ratingRepository = ratingRepository;
    }

    public TrackRatingDto submitRating(Long sessionId, String spotifyTrackId, String trackName,
                                       int trackNumber, int discNumber, Integer rating, boolean skipped,
                                       String note, SessionService sessionService) {
        ListeningSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new IllegalStateException("Session is not in progress");
        }

        TrackRating trackRating = ratingRepository.findBySessionIdAndSpotifyTrackId(sessionId, spotifyTrackId)
                .orElse(new TrackRating());

        trackRating.setSessionId(sessionId);
        trackRating.setSpotifyTrackId(spotifyTrackId);
        trackRating.setTrackName(trackName);
        trackRating.setTrackNumber(trackNumber);
        trackRating.setDiscNumber(discNumber);
        trackRating.setRating(rating);
        trackRating.setSkipped(skipped);
        trackRating.setNote(note);
        trackRating.setRatedAt(LocalDateTime.now());

        TrackRating saved = ratingRepository.save(trackRating);

        sessionService.completeIfFinished(sessionId);

        return new TrackRatingDto(
                saved.getId(),
                saved.getSpotifyTrackId(),
                saved.getTrackName(),
                saved.getTrackNumber(),
                saved.getDiscNumber(),
                saved.getRating(),
                saved.isSkipped(),
                saved.getNote(),
                saved.getRatedAt()
        );
    }
}
