ALTER TABLE "asset_search_v2" ADD COLUMN "screenshot_bucket_key" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "screenshot_bucket_key" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "screenshot_bucket_key" text;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD COLUMN "screenshot_bucket_key" text;--> statement-breakpoint
ALTER TABLE "metric_files" ADD COLUMN "screenshot_bucket_key" text;--> statement-breakpoint
ALTER TABLE "report_files" ADD COLUMN "screenshot_bucket_key" text;