CREATE TYPE "public"."chat_type_enum" AS ENUM('analyst', 'data_engineer');--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "chat_type" "chat_type_enum" DEFAULT 'analyst' NOT NULL;--> statement-breakpoint

DROP TRIGGER IF EXISTS sync_chats_text_search ON chats;--> statement-breakpoint

-- Function for chats table with screenshot_bucket_key and created_by support
CREATE OR REPLACE FUNCTION sync_chats_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    request_messages_text text;
    response_messages_text text;
    messages_text text;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Only sync chats if the type is 'analyst'
        IF NEW.chat_type = 'analyst'::"chat_type_enum" THEN
            -- Get interleaved request and response messages in chronological order
            SELECT string_agg(
                CASE 
                    WHEN request_message IS NOT NULL AND request_message != '' THEN 
                        request_message
                    ELSE ''
                END ||
                CASE 
                    WHEN response_messages IS NOT NULL AND 
                         jsonb_typeof(response_messages) = 'array' AND
                         jsonb_array_length(response_messages) > 0 AND
                         (request_message IS NOT NULL AND request_message != '') THEN
                        E'\n' || COALESCE((
                            SELECT string_agg(
                                jsonb_extract_path_text(response_item, 'message'),
                                E'\n'
                            )
                            FROM jsonb_array_elements(response_messages) AS response_item
                            WHERE jsonb_extract_path_text(response_item, 'type') = 'text'
                              AND jsonb_extract_path_text(response_item, 'message') IS NOT NULL
                              AND jsonb_extract_path_text(response_item, 'message') != ''
                        ), '')
                    WHEN response_messages IS NOT NULL AND 
                         jsonb_typeof(response_messages) = 'array' AND
                         jsonb_array_length(response_messages) > 0 THEN
                        COALESCE((
                            SELECT string_agg(
                                jsonb_extract_path_text(response_item, 'message'),
                                E'\n'
                            )
                            FROM jsonb_array_elements(response_messages) AS response_item
                            WHERE jsonb_extract_path_text(response_item, 'type') = 'text'
                              AND jsonb_extract_path_text(response_item, 'message') IS NOT NULL
                              AND jsonb_extract_path_text(response_item, 'message') != ''
                        ), '')
                    ELSE ''
                END,
                E'\n' 
                ORDER BY created_at
            )
            INTO messages_text
            FROM public.messages
            WHERE chat_id = NEW.id 
              AND deleted_at IS NULL 
              AND (
                  (request_message IS NOT NULL AND request_message != '') 
                  OR 
                  (response_messages IS NOT NULL AND 
                   jsonb_typeof(response_messages) = 'array' AND 
                   jsonb_array_length(response_messages) > 0)
              );
            
            INSERT INTO public.asset_search_v2 (
                asset_id, asset_type, title, additional_text, organization_id,
                created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
            )
            VALUES (
                NEW.id, 'chat', COALESCE(NEW.title, ''), messages_text,
                NEW.organization_id, NEW.created_by,
                NEW.created_at, NEW.updated_at, NEW.deleted_at, NEW.screenshot_bucket_key
            )
            ON CONFLICT (asset_id, asset_type) DO UPDATE SET
                title = EXCLUDED.title,
                additional_text = EXCLUDED.additional_text,
                updated_at = EXCLUDED.updated_at,
                deleted_at = EXCLUDED.deleted_at,
                screenshot_bucket_key = EXCLUDED.screenshot_bucket_key;
        ELSE
            -- If chat_type is not 'analyst', remove it from search if it exists
            UPDATE public.asset_search_v2
            SET deleted_at = NOW()
            WHERE asset_id = NEW.id AND asset_type = 'chat';
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'chat';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Recreate trigger to ensure it uses the updated function
CREATE TRIGGER sync_chats_text_search
AFTER INSERT OR UPDATE OR DELETE ON chats
FOR EACH ROW EXECUTE FUNCTION sync_chats_to_text_search();
