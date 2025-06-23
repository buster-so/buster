-- This file should undo anything in `up.sql`
ALTER TABLE messages
    ALTER COLUMN final_reasoning_message SET NOT NULL,
    ALTER COLUMN request_message SET NOT NULL;
