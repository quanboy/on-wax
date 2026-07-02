package com.onwax.service;

import com.onwax.dto.NowPlayingDto;
import com.onwax.dto.SessionDto;
import com.onwax.dto.TrackRatingDto;
import com.onwax.entity.ListeningSession;
import com.onwax.entity.TrackRating;
import com.onwax.entity.User;
import com.onwax.repository.RatingRepository;
import com.onwax.repository.SessionRepository;
import com.onwax.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final RatingRepository ratingRepository;
    private final UserRepository userRepository;

    public SessionService(SessionRepository sessionRepository, RatingRepository ratingRepository,
                          UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.ratingRepository = ratingRepository;
        this.userRepository = userRepository;
    }

    public SessionDto createSession(String spotifyUserId, NowPlayingDto nowPlaying) {
        sessionRepository.findBySpotifyUserIdAndStatus(spotifyUserId, "IN_PROGRESS")
                .ifPresent(s -> {
                    throw new IllegalStateException("A session is already in progress");
                });

        User user = userRepository.findBySpotifyUserId(spotifyUserId)
                .orElseThrow(() -> new IllegalStateException("No user found for: " + spotifyUserId));

        ListeningSession session = new ListeningSession();
        session.setSpotifyUserId(spotifyUserId);
        session.setUserId(user.getId());
        session.setSpotifyAlbumId(nowPlaying.spotifyAlbumId());
        session.setAlbumName(nowPlaying.albumName());
        session.setAlbumArtist(nowPlaying.albumArtist());
        session.setAlbumArtUrl(nowPlaying.albumArtUrl());
        session.setTotalTracks(nowPlaying.totalTracks());
        session.setStatus("IN_PROGRESS");
        session.setStartedAt(LocalDateTime.now());

        ListeningSession saved = sessionRepository.save(session);
        return toSessionDto(saved, List.of());
    }

    public Optional<SessionDto> getActiveSession(String spotifyUserId) {
        return sessionRepository.findBySpotifyUserIdAndStatus(spotifyUserId, "IN_PROGRESS")
                .map(session -> {
                    List<TrackRatingDto> ratings = loadRatings(session.getId());
                    return toSessionDto(session, ratings);
                });
    }

    public Optional<SessionDto> getSessionById(Long sessionId, String spotifyUserId) {
        return sessionRepository.findById(sessionId)
                .filter(session -> session.getSpotifyUserId().equals(spotifyUserId))
                .map(session -> {
                    List<TrackRatingDto> ratings = loadRatings(session.getId());
                    return toSessionDto(session, ratings);
                });
    }

    public List<SessionDto> getAllSessions(String spotifyUserId) {
        return sessionRepository.findAllBySpotifyUserIdOrderByStartedAtDesc(spotifyUserId)
                .stream()
                .map(session -> {
                    List<TrackRatingDto> ratings = loadRatings(session.getId());
                    return toSessionDto(session, ratings);
                })
                .toList();
    }

    public SessionDto abandonSession(Long sessionId, String spotifyUserId) {
        ListeningSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!session.getSpotifyUserId().equals(spotifyUserId)) {
            throw new IllegalArgumentException("Session not found");
        }

        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new IllegalStateException("Session is not in progress");
        }

        session.setStatus("ABANDONED");
        ListeningSession saved = sessionRepository.save(session);
        List<TrackRatingDto> ratings = loadRatings(saved.getId());
        return toSessionDto(saved, ratings);
    }

    void completeIfFinished(Long sessionId) {
        ListeningSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || !"IN_PROGRESS".equals(session.getStatus())) {
            return;
        }

        List<TrackRating> ratings = ratingRepository.findBySessionId(sessionId);
        if (ratings.size() != session.getTotalTracks()) {
            return;
        }

        BigDecimal sum = BigDecimal.ZERO;
        int count = 0;
        for (TrackRating r : ratings) {
            if (!r.isSkipped() && r.getRating() != null) {
                sum = sum.add(BigDecimal.valueOf(r.getRating()));
                count++;
            }
        }

        if (count > 0) {
            session.setFinalScore(sum.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP));
        }

        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    private List<TrackRatingDto> loadRatings(Long sessionId) {
        return ratingRepository.findBySessionId(sessionId)
                .stream()
                .map(this::toTrackRatingDto)
                .toList();
    }

    private SessionDto toSessionDto(ListeningSession session, List<TrackRatingDto> ratings) {
        return new SessionDto(
                session.getId(),
                session.getSpotifyAlbumId(),
                session.getAlbumName(),
                session.getAlbumArtist(),
                session.getAlbumArtUrl(),
                session.getTotalTracks(),
                session.getStatus(),
                session.getFinalScore(),
                session.getStartedAt(),
                session.getCompletedAt(),
                ratings
        );
    }

    private TrackRatingDto toTrackRatingDto(TrackRating r) {
        return new TrackRatingDto(
                r.getId(),
                r.getSpotifyTrackId(),
                r.getTrackName(),
                r.getTrackNumber(),
                r.getDiscNumber(),
                r.getRating(),
                r.isSkipped(),
                r.isAutoSkipped(),
                r.getNote(),
                r.getRatedAt()
        );
    }
}
