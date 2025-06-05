-- Custom SQL migration file, put your code below! --

-- Add is_completed column to messages table with default value of false
ALTER TABLE messages 
ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT false;

-- Add column description
COMMENT ON COLUMN "messages"."is_completed" IS 'Indicates if the streaming has completed from the API response. Used to track when AI flow message processing is finished.';

-- Update all existing messages to have is_completed set to true
-- This sets all existing messages as completed, while new messages will default to false
UPDATE messages 
SET is_completed = true 
WHERE is_completed = false;