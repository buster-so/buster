ALTER TABLE "chats" ADD COLUMN "screenshot_taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "screenshot_taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD COLUMN "screenshot_taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "metric_files" ADD COLUMN "screenshot_taken_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "report_files" ADD COLUMN "screenshot_taken_at" timestamp with time zone;