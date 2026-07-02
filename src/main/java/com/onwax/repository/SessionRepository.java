package com.onwax.repository;

import com.onwax.entity.ListeningSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<ListeningSession, Long> {

    Optional<ListeningSession> findBySpotifyUserIdAndStatus(String spotifyUserId, String status);

    @Query("SELECT s FROM ListeningSession s WHERE s.spotifyUserId = :spotifyUserId ORDER BY s.startedAt DESC")
    List<ListeningSession> findAllBySpotifyUserIdOrderByStartedAtDesc(@Param("spotifyUserId") String spotifyUserId);

    long countByUserIdAndStatus(Long userId, String status);

    @Query("SELECT s FROM ListeningSession s WHERE s.userId IN :userIds AND s.status = 'COMPLETED' ORDER BY s.completedAt DESC")
    List<ListeningSession> findFeedSessions(@Param("userIds") List<Long> userIds, Pageable pageable);
}
