-- Your SQL goes here
ALTER TABLE messages_to_files
ADD COLUMN version_number INTEGER NOT NULL DEFAULT 1;
