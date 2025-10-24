CREATE TYPE "public"."agent_automation_task_event_trigger_enum" AS ENUM('pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened', 'issue_comment.created');--> statement-breakpoint
CREATE TYPE "public"."agent_automation_task_type_enum" AS ENUM('data_engineer_documentation', 'data_engineer_initial_setup', 'data_engineer_upstream_change_detection');--> statement-breakpoint
CREATE TABLE "agent_automation_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"agent_type" "agent_automation_task_type_enum" NOT NULL,
	"event_trigger" "agent_automation_task_event_trigger_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "automation_task_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"action_repository" text NOT NULL,
	"modeling_repository" text
);
--> statement-breakpoint
ALTER TABLE "github_integrations" RENAME COLUMN "repository_permissions" TO "permissions";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP CONSTRAINT "github_integrations_token_vault_key_unique";--> statement-breakpoint
DROP INDEX "idx_github_integrations_github_org_id";--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "accessible_repositories" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_automation_tasks" ADD CONSTRAINT "automation_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_automation_tasks" ADD CONSTRAINT "automation_tasks_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."github_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_task_repositories" ADD CONSTRAINT "automation_task_repositories_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."agent_automation_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "token_vault_key";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "webhook_secret_vault_key";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "installed_at";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "last_used_at";