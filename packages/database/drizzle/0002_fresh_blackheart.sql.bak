CREATE TYPE "public"."table_type_enum" AS ENUM('TABLE', 'VIEW', 'MATERIALIZED_VIEW', 'EXTERNAL_TABLE', 'TEMPORARY_TABLE');--> statement-breakpoint
CREATE TABLE "database_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_source_id" uuid NOT NULL,
	"name" text NOT NULL,
	"owner" text,
	"comment" text,
	"created" timestamp with time zone,
	"last_modified" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "database_metadata_data_source_id_name_key" UNIQUE("data_source_id","name")
);
--> statement-breakpoint
CREATE TABLE "schema_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_source_id" uuid NOT NULL,
	"database_id" uuid,
	"name" text NOT NULL,
	"database_name" text NOT NULL,
	"owner" text,
	"comment" text,
	"created" timestamp with time zone,
	"last_modified" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "schema_metadata_data_source_id_database_id_name_key" UNIQUE("data_source_id","database_id","name")
);
--> statement-breakpoint
CREATE TABLE "table_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_source_id" uuid NOT NULL,
	"database_id" uuid,
	"schema_id" uuid NOT NULL,
	"name" text NOT NULL,
	"schema_name" text NOT NULL,
	"database_name" text NOT NULL,
	"type" "table_type_enum" NOT NULL,
	"row_count" bigint,
	"size_bytes" bigint,
	"comment" text,
	"created" timestamp with time zone,
	"last_modified" timestamp with time zone,
	"clustering_keys" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "table_metadata_data_source_id_schema_id_name_key" UNIQUE("data_source_id","schema_id","name")
);
--> statement-breakpoint
ALTER TABLE "database_metadata" ADD CONSTRAINT "database_metadata_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schema_metadata" ADD CONSTRAINT "schema_metadata_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schema_metadata" ADD CONSTRAINT "schema_metadata_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "public"."database_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "public"."database_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_metadata" ADD CONSTRAINT "table_metadata_schema_id_fkey" FOREIGN KEY ("schema_id") REFERENCES "public"."schema_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "database_metadata_data_source_id_idx" ON "database_metadata" USING btree ("data_source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "schema_metadata_data_source_id_idx" ON "schema_metadata" USING btree ("data_source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "schema_metadata_database_id_idx" ON "schema_metadata" USING btree ("database_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "table_metadata_data_source_id_idx" ON "table_metadata" USING btree ("data_source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "table_metadata_database_id_idx" ON "table_metadata" USING btree ("database_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "table_metadata_schema_id_idx" ON "table_metadata" USING btree ("schema_id" uuid_ops);