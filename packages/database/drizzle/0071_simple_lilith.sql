-- Add is_completed column to messages table
-- This column is used to signify if the streaming has completed from the API response.
-- Because messages are built using AI flow, we need to track when it is finished.
ALTER TABLE "messages" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
-- Add column description
COMMENT ON COLUMN "messages"."is_completed" IS 'Indicates if the streaming has completed from the API response. Used to track when AI flow message processing is finished.';
--> statement-breakpoint
-- Set all existing messages to complete (true) since they are already fully processed
UPDATE "messages" SET "is_completed" = true WHERE "is_completed" = false;
