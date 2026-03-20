package com.onwax.dto;

public record SubmitRatingRequest(
        Long sessionId,
        String spotifyTrackId,
        String trackName,
        int trackNumber,
        Integer rating,
        boolean skipped,
        String note
) {}
