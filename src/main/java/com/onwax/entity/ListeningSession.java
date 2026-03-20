package com.onwax.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "listening_sessions")
public class ListeningSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "spotify_user_id", nullable = false)
    private String spotifyUserId;

    @Column(name = "spotify_album_id", nullable = false)
    private String spotifyAlbumId;

    @Column(name = "album_name", nullable = false)
    private String albumName;

    @Column(name = "album_artist", nullable = false)
    private String albumArtist;

    @Column(name = "album_art_url", length = 500)
    private String albumArtUrl;

    @Column(name = "total_tracks", nullable = false)
    private int totalTracks;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Column(name = "final_score", precision = 4, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
