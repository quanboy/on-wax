package com.onwax.dto;

public record SubmitRatingRequest(
        Long sessionId,
        String spotifyTrackId,
        String trackName,
        int trackNumber,
        int discNumber,
        Integer rating,
        boolean skipped,
        String note
) {}
