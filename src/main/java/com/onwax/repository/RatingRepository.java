package com.onwax.repository;

import com.onwax.entity.TrackRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<TrackRating, Long> {

    List<TrackRating> findBySessionId(Long sessionId);

    Optional<TrackRating> findBySessionIdAndSpotifyTrackId(Long sessionId, String spotifyTrackId);
}
