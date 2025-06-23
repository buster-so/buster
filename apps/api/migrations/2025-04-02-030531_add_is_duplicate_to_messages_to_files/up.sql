-- Your SQL goes here

ALTER TABLE messages_to_files
ADD COLUMN is_duplicate BOOLEAN NOT NULL DEFAULT false;
