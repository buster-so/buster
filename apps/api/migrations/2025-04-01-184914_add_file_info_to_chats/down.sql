-- Drop indices first
DROP INDEX IF EXISTS idx_chats_most_recent_file_id;
DROP INDEX IF EXISTS idx_chats_most_recent_file_type;

-- Drop columns
ALTER TABLE chats
DROP COLUMN IF EXISTS most_recent_file_id,
DROP COLUMN IF EXISTS most_recent_file_type;