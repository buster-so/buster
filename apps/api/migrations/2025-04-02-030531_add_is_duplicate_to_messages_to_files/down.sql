-- This file should undo anything in `up.sql`

ALTER TABLE messages_to_files
DROP COLUMN is_duplicate;
