package com.onwax.dto;

import java.time.LocalDateTime;

public record EarnedBadgeDto(
        String code,
        String name,
        String description,
        String spotifyAlbumId,
        LocalDateTime earnedAt
) {}
