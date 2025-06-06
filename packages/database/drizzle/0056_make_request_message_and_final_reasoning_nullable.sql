-- Migration: make_request_message_and_final_reasoning_nullable
-- Created: 2025-03-25-184029
-- Original: 2025-03-25-184029_make_request_message_and_final_reasoning_nullable

ALTER TABLE messages
    ALTER COLUMN final_reasoning_message DROP NOT NULL,
    ALTER COLUMN request_message DROP NOT NULL;