package com.onwax.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 30)
        @Pattern(regexp = "^[a-z0-9][a-z0-9-]*[a-z0-9]$", message = "Username must be lowercase letters, numbers, or hyphens, and cannot start or end with a hyphen")
        String username,

        @Size(max = 100)
        String displayName,

        @Size(max = 500)
        String bio
) {}
