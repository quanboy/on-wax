package com.onwax.dto;

import java.time.LocalDateTime;

public record TrackRatingDto(
        Long id,
        String spotifyTrackId,
        String trackName,
        int trackNumber,
        int discNumber,
        Integer rating,
        boolean skipped,
        boolean autoSkipped,
        String note,
        LocalDateTime ratedAt
) {}
