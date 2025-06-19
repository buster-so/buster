-- This file should undo anything in `up.sql`

ALTER TABLE chats
DROP COLUMN most_recent_version_number;
