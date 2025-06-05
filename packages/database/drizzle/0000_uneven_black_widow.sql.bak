-- Current sql file was generated after introspecting the database
-- Migration uncommented for execution
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgroonga;

CREATE TYPE "public"."asset_permission_role_enum" AS ENUM('owner', 'editor', 'viewer', 'full_access', 'can_edit', 'can_filter', 'can_view');--> statement-breakpoint
CREATE TYPE "public"."asset_type_enum" AS ENUM('dashboard', 'thread', 'collection', 'chat', 'metric_file', 'dashboard_file');--> statement-breakpoint
CREATE TYPE "public"."data_source_onboarding_status_enum" AS ENUM('notStarted', 'inProgress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."dataset_type_enum" AS ENUM('table', 'view', 'materializedView');--> statement-breakpoint
CREATE TYPE "public"."identity_type_enum" AS ENUM('user', 'team', 'organization');--> statement-breakpoint
CREATE TYPE "public"."message_feedback_enum" AS ENUM('positive', 'negative');--> statement-breakpoint
CREATE TYPE "public"."sharing_setting_enum" AS ENUM('none', 'team', 'organization', 'public');--> statement-breakpoint
CREATE TYPE "public"."stored_values_status_enum" AS ENUM('syncing', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."team_role_enum" AS ENUM('manager', 'member');--> statement-breakpoint
CREATE TYPE "public"."user_organization_role_enum" AS ENUM('workspace_admin', 'data_admin', 'querier', 'restricted_querier', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."user_organization_status_enum" AS ENUM('active', 'inactive', 'pending', 'guest');--> statement-breakpoint
CREATE TYPE "public"."verification_enum" AS ENUM('verified', 'backlogged', 'inReview', 'requested', 'notRequested');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"key" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_key" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"sharing_setting" "sharing_setting_enum" DEFAULT 'none' NOT NULL,
	"edit_sql" boolean DEFAULT false NOT NULL,
	"upload_csv" boolean DEFAULT false NOT NULL,
	"export_assets" boolean DEFAULT false NOT NULL,
	"email_slack_enabled" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "teams_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "permission_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "permission_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"definition" text,
	"sql_snippet" text,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "terms" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dashboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"publicly_accessible" boolean DEFAULT false NOT NULL,
	"publicly_enabled_by" uuid,
	"public_expiry_date" timestamp with time zone,
	"password_secret_id" uuid,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dashboard_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "dashboard_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"secret_id" uuid NOT NULL,
	"onboarding_status" "data_source_onboarding_status_enum" DEFAULT 'notStarted' NOT NULL,
	"onboarding_error" text,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"env" varchar DEFAULT 'dev' NOT NULL,
	CONSTRAINT "data_sources_name_organization_id_env_key" UNIQUE("name","organization_id","env")
);
--> statement-breakpoint
ALTER TABLE "data_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dataset_columns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dataset_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"nullable" boolean NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"stored_values" boolean DEFAULT false,
	"stored_values_status" "stored_values_status_enum",
	"stored_values_error" text,
	"stored_values_count" bigint,
	"stored_values_last_synced" timestamp with time zone,
	"semantic_type" text,
	"dim_type" text,
	"expr" text,
	CONSTRAINT "unique_dataset_column_name" UNIQUE("dataset_id","name")
);
--> statement-breakpoint
ALTER TABLE "dataset_columns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sql_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"evaluation_obj" jsonb NOT NULL,
	"evaluation_summary" text NOT NULL,
	"score" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "asset_search" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_type" text NOT NULL,
	"content" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "asset_search" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "terms_search" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term_id" uuid NOT NULL,
	"content" text NOT NULL,
	"definition" text NOT NULL,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple'::regconfig, content)) STORED,
	"embedding" vector(1024),
	"organization_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "terms_search_term_id_key" UNIQUE("term_id")
);
--> statement-breakpoint
ALTER TABLE "terms_search" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dataset_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "dataset_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dataset_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"dataset_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"permission_type" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "dataset_permissions_dataset_id_permission_id_permission_typ_key" UNIQUE("dataset_id","permission_id","permission_type"),
	CONSTRAINT "dataset_permissions_permission_type_check" CHECK ((permission_type)::text = ANY ((ARRAY['user'::character varying, 'dataset_group'::character varying, 'permission_group'::character varying])::text[]))
);
--> statement-breakpoint
ALTER TABLE "dataset_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "__diesel_schema_migrations" (
	"version" varchar(50) PRIMARY KEY NOT NULL,
	"run_on" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "__diesel_schema_migrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "dataset_groups_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_group_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"permission_type" varchar NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "unique_dataset_group_permission" UNIQUE("dataset_group_id","permission_id","permission_type")
);
--> statement-breakpoint
CREATE TABLE "threads_deprecated" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"publicly_accessible" boolean DEFAULT false NOT NULL,
	"publicly_enabled_by" uuid,
	"public_expiry_date" timestamp with time zone,
	"password_secret_id" uuid,
	"state_message_id" uuid,
	"parent_thread_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"organization_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "threads_deprecated" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages_deprecated" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sent_by" uuid NOT NULL,
	"message" text NOT NULL,
	"responses" jsonb,
	"code" text,
	"context" jsonb,
	"title" text,
	"feedback" "message_feedback_enum",
	"verification" "verification_enum" DEFAULT 'notRequested' NOT NULL,
	"dataset_id" uuid,
	"chart_config" jsonb DEFAULT '{}'::jsonb,
	"chart_recommendations" jsonb DEFAULT '{}'::jsonb,
	"time_frame" text,
	"data_metadata" jsonb,
	"draft_session_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"draft_state" jsonb,
	"summary_question" text,
	"sql_evaluation_id" uuid
);
--> statement-breakpoint
ALTER TABLE "messages_deprecated" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"database_name" text NOT NULL,
	"when_to_use" text,
	"when_not_to_use" text,
	"type" "dataset_type_enum" NOT NULL,
	"definition" text NOT NULL,
	"schema" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"imported" boolean DEFAULT false NOT NULL,
	"data_source_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"model" text,
	"yml_file" text,
	"database_identifier" text,
	CONSTRAINT "datasets_database_name_data_source_id_key" UNIQUE("database_name","data_source_id")
);
--> statement-breakpoint
ALTER TABLE "datasets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"avatar_url" text,
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_message" text,
	"response_messages" jsonb NOT NULL,
	"reasoning" jsonb NOT NULL,
	"title" text NOT NULL,
	"raw_llm_messages" jsonb NOT NULL,
	"final_reasoning_message" text,
	"chat_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE "messages_to_files" (
	"id" uuid PRIMARY KEY NOT NULL,
	"message_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "messages_to_files_message_id_file_id_key" UNIQUE("message_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "dashboard_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"filter" varchar,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"publicly_accessible" boolean DEFAULT false NOT NULL,
	"publicly_enabled_by" uuid,
	"public_expiry_date" timestamp with time zone,
	"version_history" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"public_password" text
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"publicly_accessible" boolean DEFAULT false NOT NULL,
	"publicly_enabled_by" uuid,
	"public_expiry_date" timestamp with time zone,
	"most_recent_file_id" uuid,
	"most_recent_file_type" varchar(255),
	"most_recent_version_number" integer
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"payment_required" boolean DEFAULT false NOT NULL,
	CONSTRAINT "organizations_name_key" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stored_values_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_source_id" uuid NOT NULL,
	"database_name" text NOT NULL,
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	"column_name" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "metric_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"content" jsonb NOT NULL,
	"verification" "verification_enum" DEFAULT 'notRequested' NOT NULL,
	"evaluation_obj" jsonb,
	"evaluation_summary" text,
	"evaluation_score" double precision,
	"organization_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"publicly_accessible" boolean DEFAULT false NOT NULL,
	"publicly_enabled_by" uuid,
	"public_expiry_date" timestamp with time zone,
	"version_history" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"data_metadata" jsonb,
	"public_password" text,
	"data_source_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permission_groups_to_users" (
	"permission_group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permission_groups_to_users_pkey" PRIMARY KEY("permission_group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "permission_groups_to_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "entity_relationship" (
	"primary_dataset_id" uuid NOT NULL,
	"foreign_dataset_id" uuid NOT NULL,
	"relationship_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_relationship_pkey" PRIMARY KEY("primary_dataset_id","foreign_dataset_id")
);
--> statement-breakpoint
CREATE TABLE "metric_files_to_datasets" (
	"metric_file_id" uuid NOT NULL,
	"dataset_id" uuid NOT NULL,
	"metric_version_number" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metric_files_to_datasets_pkey" PRIMARY KEY("metric_file_id","dataset_id","metric_version_number")
);
--> statement-breakpoint
CREATE TABLE "terms_to_datasets" (
	"term_id" uuid NOT NULL,
	"dataset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "terms_to_datasets_pkey" PRIMARY KEY("term_id","dataset_id")
);
--> statement-breakpoint
ALTER TABLE "terms_to_datasets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "datasets_to_permission_groups" (
	"dataset_id" uuid NOT NULL,
	"permission_group_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "datasets_to_permission_groups_pkey" PRIMARY KEY("dataset_id","permission_group_id")
);
--> statement-breakpoint
ALTER TABLE "datasets_to_permission_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "datasets_to_dataset_groups" (
	"dataset_id" uuid NOT NULL,
	"dataset_group_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "datasets_to_dataset_groups_pkey" PRIMARY KEY("dataset_id","dataset_group_id")
);
--> statement-breakpoint
ALTER TABLE "datasets_to_dataset_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "threads_to_dashboards" (
	"thread_id" uuid NOT NULL,
	"dashboard_id" uuid NOT NULL,
	"added_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "threads_to_dashboards_pkey" PRIMARY KEY("thread_id","dashboard_id")
);
--> statement-breakpoint
ALTER TABLE "threads_to_dashboards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"order_index" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "user_favorites_pkey" PRIMARY KEY("user_id","asset_id","asset_type")
);
--> statement-breakpoint
ALTER TABLE "user_favorites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "teams_to_users" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role_enum" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "teams_to_users_pkey" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "teams_to_users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "metric_files_to_dashboard_files" (
	"metric_file_id" uuid NOT NULL,
	"dashboard_file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	CONSTRAINT "metric_files_to_dashboard_files_pkey" PRIMARY KEY("metric_file_id","dashboard_file_id")
);
--> statement-breakpoint
CREATE TABLE "collections_to_assets" (
	"collection_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	CONSTRAINT "collections_to_assets_pkey" PRIMARY KEY("collection_id","asset_id","asset_type")
);
--> statement-breakpoint
ALTER TABLE "collections_to_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "permission_groups_to_identities" (
	"permission_group_id" uuid NOT NULL,
	"identity_id" uuid NOT NULL,
	"identity_type" "identity_type_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	CONSTRAINT "permission_groups_to_identities_pkey" PRIMARY KEY("permission_group_id","identity_id","identity_type")
);
--> statement-breakpoint
ALTER TABLE "permission_groups_to_identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "asset_permissions" (
	"identity_id" uuid NOT NULL,
	"identity_type" "identity_type_enum" NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"role" "asset_permission_role_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	CONSTRAINT "asset_permissions_pkey" PRIMARY KEY("identity_id","identity_type","asset_id","asset_type")
);
--> statement-breakpoint
ALTER TABLE "asset_permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users_to_organizations" (
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "user_organization_role_enum" DEFAULT 'querier' NOT NULL,
	"sharing_setting" "sharing_setting_enum" DEFAULT 'none' NOT NULL,
	"edit_sql" boolean DEFAULT false NOT NULL,
	"upload_csv" boolean DEFAULT false NOT NULL,
	"export_assets" boolean DEFAULT false NOT NULL,
	"email_slack_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"deleted_by" uuid,
	"status" "user_organization_status_enum" DEFAULT 'active' NOT NULL,
	CONSTRAINT "users_to_organizations_pkey" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
ALTER TABLE "users_to_organizations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboards" ADD CONSTRAINT "dashboards_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboard_versions" ADD CONSTRAINT "dashboard_versions_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "data_sources" ADD CONSTRAINT "data_sources_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "terms_search" ADD CONSTRAINT "terms_search_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_groups" ADD CONSTRAINT "dataset_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_permissions" ADD CONSTRAINT "dataset_permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_permissions" ADD CONSTRAINT "dataset_permissions_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_groups_permissions" ADD CONSTRAINT "dataset_groups_permissions_dataset_group_id_fkey" FOREIGN KEY ("dataset_group_id") REFERENCES "public"."dataset_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_groups_permissions" ADD CONSTRAINT "dataset_groups_permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_parent_thread_id_fkey" FOREIGN KEY ("parent_thread_id") REFERENCES "public"."threads_deprecated"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_deprecated_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_deprecated_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "threads_deprecated" ADD CONSTRAINT "threads_deprecated_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages_deprecated" ADD CONSTRAINT "messages_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages_deprecated" ADD CONSTRAINT "messages_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_deprecated" ADD CONSTRAINT "messages_deprecated_sent_by_fkey" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages_to_files" ADD CONSTRAINT "messages_to_files_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD CONSTRAINT "dashboard_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dashboard_files" ADD CONSTRAINT "dashboard_files_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "stored_values_sync_jobs" ADD CONSTRAINT "stored_values_sync_jobs_data_source_id_fkey" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_files" ADD CONSTRAINT "metric_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "metric_files" ADD CONSTRAINT "metric_files_publicly_enabled_by_fkey" FOREIGN KEY ("publicly_enabled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "metric_files" ADD CONSTRAINT "fk_data_source" FOREIGN KEY ("data_source_id") REFERENCES "public"."data_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_groups_to_users" ADD CONSTRAINT "permission_groups_to_users_permission_group_id_fkey" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permission_groups_to_users" ADD CONSTRAINT "permission_groups_to_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "metric_files_to_datasets" ADD CONSTRAINT "fk_metric_file" FOREIGN KEY ("metric_file_id") REFERENCES "public"."metric_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_files_to_datasets" ADD CONSTRAINT "fk_dataset" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_to_datasets" ADD CONSTRAINT "terms_to_datasets_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_to_datasets" ADD CONSTRAINT "terms_to_datasets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets_to_permission_groups" ADD CONSTRAINT "datasets_to_permission_groups_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets_to_permission_groups" ADD CONSTRAINT "datasets_to_permission_groups_permission_group_id_fkey" FOREIGN KEY ("permission_group_id") REFERENCES "public"."permission_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets_to_dataset_groups" ADD CONSTRAINT "datasets_to_dataset_groups_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets_to_dataset_groups" ADD CONSTRAINT "datasets_to_dataset_groups_dataset_group_id_fkey" FOREIGN KEY ("dataset_group_id") REFERENCES "public"."dataset_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads_to_dashboards" ADD CONSTRAINT "threads_to_dashboards_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."threads_deprecated"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads_to_dashboards" ADD CONSTRAINT "threads_to_dashboards_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threads_to_dashboards" ADD CONSTRAINT "threads_to_dashboards_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "teams_to_users" ADD CONSTRAINT "teams_to_users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams_to_users" ADD CONSTRAINT "teams_to_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "metric_files_to_dashboard_files" ADD CONSTRAINT "metric_files_to_dashboard_files_metric_file_id_fkey" FOREIGN KEY ("metric_file_id") REFERENCES "public"."metric_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_files_to_dashboard_files" ADD CONSTRAINT "metric_files_to_dashboard_files_dashboard_file_id_fkey" FOREIGN KEY ("dashboard_file_id") REFERENCES "public"."dashboard_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_files_to_dashboard_files" ADD CONSTRAINT "metric_files_to_dashboard_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "collections_to_assets" ADD CONSTRAINT "collections_to_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "collections_to_assets" ADD CONSTRAINT "collections_to_assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permission_groups_to_identities" ADD CONSTRAINT "permission_groups_to_identities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "permission_groups_to_identities" ADD CONSTRAINT "permission_groups_to_identities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_permissions" ADD CONSTRAINT "asset_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "asset_permissions" ADD CONSTRAINT "asset_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_organizations" ADD CONSTRAINT "users_to_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_organizations" ADD CONSTRAINT "users_to_organizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_organizations" ADD CONSTRAINT "users_to_organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_organizations" ADD CONSTRAINT "users_to_organizations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_to_organizations" ADD CONSTRAINT "users_to_organizations_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "asset_search_asset_id_asset_type_idx" ON "asset_search" USING btree ("asset_id" uuid_ops,"asset_type" text_ops);--> statement-breakpoint
CREATE INDEX "pgroonga_content_index" ON "asset_search" USING pgroonga ("content" pgroonga_text_full_text_search_ops_v2);--> statement-breakpoint
CREATE INDEX "terms_search_embedding_idx" ON "terms_search" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "terms_search_fts_idx" ON "terms_search" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "terms_search_term_id_organization_id_idx" ON "terms_search" USING btree ("term_id" uuid_ops,"organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dataset_groups_deleted_at_idx" ON "dataset_groups" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "dataset_groups_organization_id_idx" ON "dataset_groups" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dataset_permissions_dataset_id_idx" ON "dataset_permissions" USING btree ("dataset_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dataset_permissions_deleted_at_idx" ON "dataset_permissions" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "dataset_permissions_organization_id_idx" ON "dataset_permissions" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dataset_permissions_permission_lookup_idx" ON "dataset_permissions" USING btree ("permission_id" uuid_ops,"permission_type" text_ops);--> statement-breakpoint
CREATE INDEX "dataset_groups_permissions_dataset_group_id_idx" ON "dataset_groups_permissions" USING btree ("dataset_group_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dataset_groups_permissions_organization_id_idx" ON "dataset_groups_permissions" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dataset_groups_permissions_permission_id_idx" ON "dataset_groups_permissions" USING btree ("permission_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "messages" USING btree ("chat_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "messages_created_by_idx" ON "messages" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "messages_files_file_id_idx" ON "messages_to_files" USING btree ("file_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "messages_files_message_id_idx" ON "messages_to_files" USING btree ("message_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "dashboard_files_created_by_idx" ON "dashboard_files" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "dashboard_files_deleted_at_idx" ON "dashboard_files" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "dashboard_files_organization_id_idx" ON "dashboard_files" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "chats_created_at_idx" ON "chats" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "chats_created_by_idx" ON "chats" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "chats_organization_id_idx" ON "chats" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chats_most_recent_file_id" ON "chats" USING btree ("most_recent_file_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_chats_most_recent_file_type" ON "chats" USING btree ("most_recent_file_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stored_values_sync_jobs_data_source_id" ON "stored_values_sync_jobs" USING btree ("data_source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_stored_values_sync_jobs_db_schema_table_column" ON "stored_values_sync_jobs" USING btree ("database_name" text_ops,"schema_name" text_ops,"table_name" text_ops,"column_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_stored_values_sync_jobs_status" ON "stored_values_sync_jobs" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "metric_files_created_by_idx" ON "metric_files" USING btree ("created_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "metric_files_data_metadata_idx" ON "metric_files" USING gin ("data_metadata" jsonb_ops);--> statement-breakpoint
CREATE INDEX "metric_files_deleted_at_idx" ON "metric_files" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "metric_files_organization_id_idx" ON "metric_files" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "permission_groups_to_users_user_id_idx" ON "permission_groups_to_users" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "datasets_to_dataset_groups_dataset_group_id_idx" ON "datasets_to_dataset_groups" USING btree ("dataset_group_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "metric_files_to_dashboard_files_dashboard_id_idx" ON "metric_files_to_dashboard_files" USING btree ("dashboard_file_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "metric_files_to_dashboard_files_deleted_at_idx" ON "metric_files_to_dashboard_files" USING btree ("deleted_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "metric_files_to_dashboard_files_metric_id_idx" ON "metric_files_to_dashboard_files" USING btree ("metric_file_id" uuid_ops);--> statement-breakpoint
CREATE POLICY "dataset_groups_policy" ON "dataset_groups" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "dataset_permissions_policy" ON "dataset_permissions" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "diesel_schema_migrations_policy" ON "__diesel_schema_migrations" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "permission_groups_to_users_policy" ON "permission_groups_to_users" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "datasets_to_permission_groups_policy" ON "datasets_to_permission_groups" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "datasets_to_dataset_groups_policy" ON "datasets_to_dataset_groups" AS PERMISSIVE FOR ALL TO "authenticated" USING (true);