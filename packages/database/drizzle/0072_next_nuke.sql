CREATE TYPE "public"."slack_integration_status_enum" AS ENUM('pending', 'active', 'failed', 'revoked');--> statement-breakpoint
CREATE TABLE "slack_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"oauth_state" varchar(255),
	"oauth_expires_at" timestamp with time zone,
	"oauth_metadata" jsonb DEFAULT '{}'::jsonb,
	"team_id" varchar(255),
	"team_name" varchar(255),
	"team_domain" varchar(255),
	"enterprise_id" varchar(255),
	"bot_user_id" varchar(255),
	"scope" text,
	"token_vault_key" varchar(255),
	"installed_by_slack_user_id" varchar(255),
	"installed_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"status" "slack_integration_status_enum" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "slack_integrations_oauth_state_unique" UNIQUE("oauth_state"),
	CONSTRAINT "slack_integrations_token_vault_key_unique" UNIQUE("token_vault_key"),
	CONSTRAINT "slack_integrations_org_team_key" UNIQUE("organization_id","team_id"),
	CONSTRAINT "slack_integrations_status_check" CHECK ((status = 'pending' AND oauth_state IS NOT NULL) OR (status != 'pending' AND team_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "slack_message_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"internal_message_id" uuid NOT NULL,
	"slack_channel_id" varchar(255) NOT NULL,
	"slack_message_ts" varchar(255) NOT NULL,
	"slack_thread_ts" varchar(255),
	"message_type" varchar(50) NOT NULL,
	"content" text,
	"sender_info" jsonb,
	"sent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slack_message_tracking_internal_message_id_unique" UNIQUE("internal_message_id")
);
--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slack_message_tracking" ADD CONSTRAINT "slack_message_tracking_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."slack_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_slack_integrations_org_id" ON "slack_integrations" USING btree ("organization_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_slack_integrations_team_id" ON "slack_integrations" USING btree ("team_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_slack_integrations_oauth_state" ON "slack_integrations" USING btree ("oauth_state" text_ops);--> statement-breakpoint
CREATE INDEX "idx_slack_integrations_oauth_expires" ON "slack_integrations" USING btree ("oauth_expires_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_message_tracking_integration" ON "slack_message_tracking" USING btree ("integration_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_message_tracking_channel" ON "slack_message_tracking" USING btree ("slack_channel_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_message_tracking_thread" ON "slack_message_tracking" USING btree ("slack_thread_ts" text_ops);