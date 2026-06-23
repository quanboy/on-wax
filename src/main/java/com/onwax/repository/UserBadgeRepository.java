package com.onwax.repository;

import com.onwax.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    boolean existsByUserIdAndBadgeIdAndSpotifyAlbumId(Long userId, Long badgeId, String spotifyAlbumId);

    List<UserBadge> findByUserIdOrderByEarnedAtDesc(Long userId);
}
