
CREATE TABLE "report_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"publicly_accessible" boolean DEFAULT false NOT NULL,
	"publicly_enabled_by" uuid,
	"public_expiry_date" timestamp with time zone,
	"version_history" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"public_password" text,
	"workspace_sharing" "workspace_sharing_enum" DEFAULT 'none' NOT NULL,
	"workspace_sharing_enabled_by" uuid,
	"workspace_sharing_enabled_at" timestamp with time zone
);
--> statement-breakpoint

ALTER TABLE "report_files" ADD CONSTRAINT "report_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_workspace_sharing_enabled_by_fkey" FOREIGN KEY ("workspace_sharing_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint

CREATE INDEX "report_files_created_by_idx" ON "report_files" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "report_files_deleted_at_idx" ON "report_files" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "report_files_organization_id_idx" ON "report_files" USING btree ("organization_id" uuid_ops);