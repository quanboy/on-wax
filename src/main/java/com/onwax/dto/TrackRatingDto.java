package com.onwax.dto;

import java.time.LocalDateTime;

public record TrackRatingDto(
        Long id,
        String spotifyTrackId,
        String trackName,
        int trackNumber,
        Integer rating,
        boolean skipped,
        String note,
        LocalDateTime ratedAt
) {}
