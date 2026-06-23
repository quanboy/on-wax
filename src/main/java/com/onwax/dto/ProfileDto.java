package com.onwax.dto;

import java.time.LocalDateTime;

public record ProfileDto(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        String bio,
        LocalDateTime createdAt
) {}
