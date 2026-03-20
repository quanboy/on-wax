package com.onwax.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SessionDto(
        Long id,
        String spotifyAlbumId,
        String albumName,
        String albumArtist,
        String albumArtUrl,
        int totalTracks,
        String status,
        BigDecimal finalScore,
        LocalDateTime startedAt,
        LocalDateTime completedAt,
        List<TrackRatingDto> ratings
) {}
