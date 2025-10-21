ALTER TABLE "dashboard_files" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "error_reason" text;