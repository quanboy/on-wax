package com.onwax.dto;

public record NowPlayingDto(
        String spotifyTrackId,
        String trackName,
        int trackNumber,
        String spotifyAlbumId,
        String albumName,
        String albumArtist,
        String albumArtUrl,
        int totalTracks,
        boolean isPlaying
) {}
