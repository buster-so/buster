-- Create new enum type
CREATE TYPE "public"."chat_updated_by_type_enum" AS ENUM('user', 'agent');--> statement-breakpoint

-- Add new column with default value
ALTER TABLE "chats" ADD COLUMN "updated_by_type" "chat_updated_by_type_enum" DEFAULT 'agent' NOT NULL;--> statement-breakpoint

-- Copy data from old column to new column
UPDATE "chats" SET "updated_by_type" = "title_updated_by"::"text"::"chat_updated_by_type_enum";--> statement-breakpoint

-- Drop old column
ALTER TABLE "chats" DROP COLUMN "title_updated_by";--> statement-breakpoint

-- Drop old enum type
DROP TYPE "public"."chat_title_updated_by_enum";