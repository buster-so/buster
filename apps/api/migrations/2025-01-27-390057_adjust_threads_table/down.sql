-- This file should undo anything in `up.sql`

-- Drop indexes if they exist
DROP INDEX IF EXISTS chats_organization_id_idx;
DROP INDEX IF EXISTS chats_created_by_idx;
DROP INDEX IF EXISTS chats_created_at_idx;

-- Drop new threads table if it exists
DROP TABLE IF EXISTS chats;


