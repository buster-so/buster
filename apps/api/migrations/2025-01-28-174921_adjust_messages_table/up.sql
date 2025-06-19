-- Your SQL goes here
-- Rename existing messages table to messages_deprecated
ALTER TABLE messages DROP CONSTRAINT messages_thread_id_fkey;

ALTER TABLE messages RENAME TO messages_deprecated;

-- Create new messages table with updated schema
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_message TEXT NOT NULL,
    response_messages JSONB NOT NULL,
    reasoning JSONB NOT NULL,
    title TEXT NOT NULL,
    raw_llm_messages JSONB NOT NULL,
    final_reasoning_message TEXT NOT NULL,
    chat_id UUID NOT NULL REFERENCES chats(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), 
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id)
);


-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_created_by_idx ON messages(created_by);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);


