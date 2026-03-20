package com.onwax.repository;

import com.onwax.entity.SpotifyToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SpotifyTokenRepository extends JpaRepository<SpotifyToken, Long> {

    Optional<SpotifyToken> findBySpotifyUserId(String spotifyUserId);
}
