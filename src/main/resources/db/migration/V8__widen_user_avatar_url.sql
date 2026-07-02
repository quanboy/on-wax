-- Spotify profile image URLs (especially Facebook-sourced avatars) can exceed 500 chars.
ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT;
