-- This file should undo anything in `up.sql`
-- Drop indexes first
DROP INDEX IF EXISTS messages_chat_id_idx;
DROP INDEX IF EXISTS messages_created_by_idx;
DROP INDEX IF EXISTS messages_created_at_idx;

-- Drop new messages table
DROP TABLE messages;

-- Rename deprecated table back to messages
ALTER TABLE messages_deprecated RENAME TO messages;

-- Drop existing constraint if it exists
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_thread_id_fkey;

-- Restore foreign key constraint
ALTER TABLE messages 
ADD CONSTRAINT messages_thread_id_fkey 
FOREIGN KEY (thread_id) REFERENCES threads(id);
