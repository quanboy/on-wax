package com.onwax.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record FeedItemDto(
        Long sessionId,
        String username,
        String displayName,
        String avatarUrl,
        String spotifyAlbumId,
        String albumName,
        String albumArtist,
        String albumArtUrl,
        BigDecimal finalScore,
        LocalDateTime completedAt
) {}
