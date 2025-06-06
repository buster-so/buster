-- Migration: add_version_to_messages_to_files_table
-- Created: 2025-04-07-145234
-- Original: 2025-04-07-145234_add_version_to_messages_to_files_table

ALTER TABLE messages_to_files
ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;