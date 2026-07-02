-- App-owned identity. One row per Spotify account that has logged in.
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    spotify_user_id VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Backfill a user for every account we already have a token for.
-- Seed username from the Spotify ID (guaranteed unique); users can rename later.
INSERT INTO users (spotify_user_id, username)
SELECT spotify_user_id, spotify_user_id
FROM spotify_tokens
ON CONFLICT (spotify_user_id) DO NOTHING;

-- Add user_id FKs to the tables that carry an owner.
-- track_ratings is intentionally left out: it derives its owner via session_id.
ALTER TABLE spotify_tokens ADD COLUMN user_id BIGINT;
ALTER TABLE listening_sessions ADD COLUMN user_id BIGINT;

UPDATE spotify_tokens t
SET user_id = u.id
FROM users u
WHERE u.spotify_user_id = t.spotify_user_id;

UPDATE listening_sessions s
SET user_id = u.id
FROM users u
WHERE u.spotify_user_id = s.spotify_user_id;

-- Enforce now that existing rows are backfilled.
ALTER TABLE spotify_tokens ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE spotify_tokens ADD CONSTRAINT uq_spotify_tokens_user_id UNIQUE (user_id);
ALTER TABLE spotify_tokens ADD CONSTRAINT fk_spotify_tokens_user FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE listening_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE listening_sessions ADD CONSTRAINT fk_listening_sessions_user FOREIGN KEY (user_id) REFERENCES users(id);
CREATE INDEX idx_listening_sessions_user_id ON listening_sessions(user_id);
