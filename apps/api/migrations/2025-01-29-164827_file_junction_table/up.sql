CREATE TABLE messages_to_files (
    id UUID PRIMARY KEY,
    message_id UUID NOT NULL REFERENCES messages(id),
    file_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(message_id, file_id)
);

-- Index for faster lookups by message_id
CREATE INDEX messages_files_message_id_idx ON messages_to_files(message_id);

-- Index for faster lookups by file_id
CREATE INDEX messages_files_file_id_idx ON messages_to_files(file_id);
