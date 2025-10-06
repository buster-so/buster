CREATE TABLE "logs_write_back_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"data_source_id" uuid NOT NULL,
	"database" varchar(255) NOT NULL,
	"schema" varchar(255) NOT NULL,
	"table_name" varchar(255) DEFAULT 'buster_query_logs' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "logs_write_back_configs" ADD CONSTRAINT "logs_write_back_configs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_write_back_configs" ADD CONSTRAINT "logs_write_back_configs_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "logs_write_back_configs_org_unique" ON "logs_write_back_configs" USING btree ("organization_id") WHERE "logs_write_back_configs"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_logs_write_back_configs_org_id" ON "logs_write_back_configs" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_logs_write_back_configs_data_source_id" ON "logs_write_back_configs" USING btree ("data_source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_logs_write_back_configs_deleted_at" ON "logs_write_back_configs" USING btree ("deleted_at");