CREATE TABLE listening_sessions (
    id BIGSERIAL PRIMARY KEY,
    spotify_user_id VARCHAR(255) NOT NULL,
    spotify_album_id VARCHAR(255) NOT NULL,
    album_name VARCHAR(255) NOT NULL,
    album_artist VARCHAR(255) NOT NULL,
    album_art_url VARCHAR(500),
    total_tracks INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    final_score NUMERIC(4,2),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);
