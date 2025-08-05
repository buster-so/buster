ALTER TABLE "report_files" ADD CONSTRAINT "report_files_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE cascade;

ALTER TABLE "asset_search" ALTER COLUMN "asset_type" SET DATA TYPE text;--> statement-breakpoint

ALTER TABLE "dashboard_files" ALTER COLUMN "content" SET DEFAULT '[]'::jsonb;