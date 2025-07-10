ALTER TABLE "messages" ADD COLUMN "trigger_run_id" varchar(255);--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "default_role" "user_organization_role_enum" DEFAULT 'restricted_querier' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "defaultRole";