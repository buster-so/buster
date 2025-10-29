CREATE TABLE "user_library" (
	"user_id" uuid NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "user_library_pkey" PRIMARY KEY("user_id","asset_type","asset_id")
);
--> statement-breakpoint
ALTER TABLE "user_library" ADD CONSTRAINT "user_library_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "saved_to_library";--> statement-breakpoint
ALTER TABLE "dashboard_files" DROP COLUMN "saved_to_library";--> statement-breakpoint
ALTER TABLE "metric_files" DROP COLUMN "saved_to_library";--> statement-breakpoint
ALTER TABLE "report_files" DROP COLUMN "saved_to_library";