ALTER TABLE "users" ALTER COLUMN "suggested_prompts" SET DEFAULT '{
        "suggestedPrompts": {
          "report": [
            "provide a trend analysis of quarterly profits",
            "evaluate product performance across regions"
          ],
          "dashboard": [
            "create a sales performance dashboard",
            "design a revenue forecast dashboard"
          ],
          "visualization": [
            "create a metric for monthly sales",
            "show top vendors by purchase volume"
          ],
          "help": [
            "what types of analyses can you perform?",
            "what questions can I ask buster?",
            "what data models are available for queries?",
            "can you explain your forecasting capabilities?"
          ]
        },
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }'::jsonb;--> statement-breakpoint
CREATE INDEX "idx_perm_active_asset_identity" ON "asset_permissions" USING btree ("asset_id","asset_type","identity_id","identity_type") WHERE "asset_permissions"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_as2_active_by_asset" ON "asset_search_v2" USING btree ("asset_id","asset_type") WHERE "asset_search_v2"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_cta_active_by_asset" ON "collections_to_assets" USING btree ("asset_id","asset_type","collection_id") WHERE "collections_to_assets"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_mtf_active_by_file" ON "messages_to_files" USING btree ("message_id") WHERE "messages_to_files"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "idx_uto_active_by_user" ON "users_to_organizations" USING btree ("user_id","organization_id") WHERE "users_to_organizations"."deleted_at" is null;