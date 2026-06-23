package com.onwax.repository;

import com.onwax.entity.TrackRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<TrackRating, Long> {

    List<TrackRating> findBySessionId(Long sessionId);

    Optional<TrackRating> findBySessionIdAndSpotifyTrackId(Long sessionId, String spotifyTrackId);

    @Query("SELECT COUNT(r) FROM TrackRating r WHERE r.sessionId = :sessionId AND r.rating IS NOT NULL AND r.skipped = false")
    long countScoredBySessionId(@Param("sessionId") Long sessionId);
}
