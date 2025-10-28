CREATE TYPE "public"."agent_event_trigger_enum" AS ENUM('pull_request.opened', 'pull_request.synchronize', 'pull_request.reopened', 'issue_comment.created', 'push');--> statement-breakpoint
CREATE TYPE "public"."agent_name_enum" AS ENUM('documentation_agent', 'upstream_conflict_agent');--> statement-breakpoint
CREATE TABLE "agent_automation_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"integration_id" uuid NOT NULL,
	"agent_name" "agent_name_enum" NOT NULL,
	"event_trigger" "agent_event_trigger_enum" NOT NULL,
	"repository" text NOT NULL,
	"branches" text[] DEFAULT '{"*"}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agent_upstream_repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_automation_task_id" uuid NOT NULL,
	"repository" text NOT NULL,
	"upstream_repository" text NOT NULL,
	"branches" text[] DEFAULT '{"*"}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_integrations" RENAME COLUMN "repository_permissions" TO "permissions";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP CONSTRAINT "github_integrations_token_vault_key_unique";--> statement-breakpoint
DROP INDEX "idx_github_integrations_github_org_id";--> statement-breakpoint
ALTER TABLE "github_integrations" ADD COLUMN "accessible_repositories" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "agent_automation_tasks" ADD CONSTRAINT "automation_tasks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_automation_tasks" ADD CONSTRAINT "automation_tasks_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."github_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_upstream_repositories" ADD CONSTRAINT "automation_task_repositories_task_id_fkey" FOREIGN KEY ("agent_automation_task_id") REFERENCES "public"."agent_automation_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_automation_tasks_unique_active" ON "agent_automation_tasks" USING btree ("organization_id","integration_id","agent_name","event_trigger") WHERE "agent_automation_tasks"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "token_vault_key";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "webhook_secret_vault_key";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "installed_at";--> statement-breakpoint
ALTER TABLE "github_integrations" DROP COLUMN "last_used_at";