ALTER TABLE "chats" ADD COLUMN "saved_to_library" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD COLUMN "saved_to_library" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "metric_files" ADD COLUMN "saved_to_library" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "report_files" ADD COLUMN "saved_to_library" boolean DEFAULT false NOT NULL;