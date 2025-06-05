-- Migration: add_user_avatar_url
-- Created: 2025-03-05-201142
-- Original: 2025-03-05-201142_add_user_avatar_url

ALTER TABLE users
ADD COLUMN avatar_url TEXT NULL;