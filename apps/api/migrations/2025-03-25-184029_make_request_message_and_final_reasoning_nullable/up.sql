-- Your SQL goes here
ALTER TABLE messages
    ALTER COLUMN final_reasoning_message DROP NOT NULL,
    ALTER COLUMN request_message DROP NOT NULL;
