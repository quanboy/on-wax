package com.onwax.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SubmitRatingRequest(
        @NotNull Long sessionId,
        @NotBlank String spotifyTrackId,
        @NotBlank @Size(max = 255) String trackName,
        @Min(1) int trackNumber,
        @Min(1) int discNumber,
        @Min(1) @Max(10) Integer rating,
        boolean skipped,
        @Size(max = 1000) String note
) {}
