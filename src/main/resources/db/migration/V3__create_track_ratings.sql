CREATE TABLE track_ratings (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES listening_sessions(id),
    spotify_track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(255) NOT NULL,
    track_number INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 10),
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    rated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, spotify_track_id)
);
