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

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "track_ratings")
public class TrackRating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "spotify_track_id", nullable = false)
    private String spotifyTrackId;

    @Column(name = "track_name", nullable = false)
    private String trackName;

    @Column(name = "track_number", nullable = false)
    private int trackNumber;

    @Column(name = "disc_number", nullable = false)
    private int discNumber;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "skipped", nullable = false)
    private boolean skipped;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "rated_at", nullable = false)
    private LocalDateTime ratedAt;
}
