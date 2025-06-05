-- Migration: add_is_duplicate_to_messages_to_files
-- Created: 2025-04-02-030531
-- Original: 2025-04-02-030531_add_is_duplicate_to_messages_to_files

ALTER TABLE messages_to_files
ADD COLUMN is_duplicate BOOLEAN NOT NULL DEFAULT false;