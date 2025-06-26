CREATE TABLE "messages_to_slack_messages" (
	"message_id" uuid NOT NULL,
	"slack_message_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "messages_to_slack_messages_pkey" PRIMARY KEY("message_id","slack_message_id")
);
--> statement-breakpoint
ALTER TABLE "messages_to_slack_messages" ADD CONSTRAINT "messages_to_slack_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages_to_slack_messages" ADD CONSTRAINT "messages_to_slack_messages_slack_message_id_fkey" FOREIGN KEY ("slack_message_id") REFERENCES "public"."slack_message_tracking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "messages_to_slack_messages_message_id_idx" ON "messages_to_slack_messages" USING btree ("message_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "messages_to_slack_messages_slack_message_id_idx" ON "messages_to_slack_messages" USING btree ("slack_message_id" uuid_ops);