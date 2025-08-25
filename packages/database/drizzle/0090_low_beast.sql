CREATE TYPE "public"."storage_provider_enum" AS ENUM('s3', 'r2', 'gcs');--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'data_source';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'metric';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'filter';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'dataset';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'tool';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'source';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'collection_file';--> statement-breakpoint
ALTER TYPE "public"."asset_type_enum" ADD VALUE 'dataset_permission';--> statement-breakpoint
CREATE TABLE "s3_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "storage_provider_enum" NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "s3_integrations" ADD CONSTRAINT "s3_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_s3_integrations_organization_id" ON "s3_integrations" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_s3_integrations_deleted_at" ON "s3_integrations" USING btree ("deleted_at");