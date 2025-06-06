-- Migration: add_file_info_to_chats
-- Created: 2025-04-01-184914
-- Original: 2025-04-01-184914_add_file_info_to_chats

ALTER TABLE chats
ADD COLUMN most_recent_file_id UUID NULL,
ADD COLUMN most_recent_file_type VARCHAR(255) NULL;

-- Add indices to improve query performance
CREATE INDEX idx_chats_most_recent_file_id ON chats(most_recent_file_id);
CREATE INDEX idx_chats_most_recent_file_type ON chats(most_recent_file_type);

-- Data Migration - Set most_recent_file_id and most_recent_file_type for existing chats
WITH LatestFilePerChat AS (
    SELECT DISTINCT ON (m.chat_id)
        m.chat_id,
        mtf.file_id,
        -- Determine file type 
        CASE
            WHEN mf.id IS NOT NULL THEN 'metric'
            WHEN df.id IS NOT NULL THEN 'dashboard'
            ELSE NULL
        END AS file_type
    FROM messages m
    JOIN messages_to_files mtf ON m.id = mtf.message_id
    LEFT JOIN metric_files mf ON mtf.file_id = mf.id
    LEFT JOIN dashboard_files df ON mtf.file_id = df.id
    WHERE m.deleted_at IS NULL AND mtf.deleted_at IS NULL
    ORDER BY m.chat_id, m.created_at DESC
)
UPDATE chats c
SET
    most_recent_file_id = lfpc.file_id,
    most_recent_file_type = lfpc.file_type
FROM LatestFilePerChat lfpc
WHERE c.id = lfpc.chat_id;