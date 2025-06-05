-- Migration: add_most_recent_version_number_to_chats
-- Created: 2025-04-08-213658
-- Original: 2025-04-08-213658_add_most_recent_version_number_to_chats

ALTER TABLE chats
ADD COLUMN most_recent_version_number INTEGER;