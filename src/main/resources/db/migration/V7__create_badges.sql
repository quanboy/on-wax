-- Catalog of earnable badges. Seeded here; code is the stable identifier used by the engine.
CREATE TABLE badge_definitions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

INSERT INTO badge_definitions (code, name, description) VALUES
    ('HALF_ALBUM', 'Half Album', 'Rated at least half of an album''s tracks.'),
    ('FULL_ALBUM', 'Full Album', 'Rated every track on an album.');

-- Awarded badges. One row per (user, badge, album) so each badge is earned once per album.
CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    badge_id BIGINT NOT NULL REFERENCES badge_definitions(id),
    spotify_album_id VARCHAR(255) NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_id, spotify_album_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
