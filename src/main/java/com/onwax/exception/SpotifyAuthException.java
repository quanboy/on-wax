package com.onwax.exception;

/**
 * Thrown when Spotify authentication can no longer be satisfied for a user
 * (e.g. the refresh token has been revoked or expired). Maps to HTTP 401 so
 * the frontend interceptor re-triggers the OAuth login flow.
 */
public class SpotifyAuthException extends RuntimeException {

    public SpotifyAuthException(String message, Throwable cause) {
        super(message, cause);
    }

    public SpotifyAuthException(String message) {
        super(message);
    }
}
