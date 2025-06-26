ALTER TABLE "messages" ADD COLUMN "post_processing_message" jsonb;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD COLUMN "default_channel_id" varchar(255);