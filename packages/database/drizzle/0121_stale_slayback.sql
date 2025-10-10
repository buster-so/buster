-- Custom SQL migration file, put your code below! --

-- Drop existing triggers to recreate them with screenshot_bucket_key and created_by support
DROP TRIGGER IF EXISTS sync_chats_text_search ON chats;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_metric_files_text_search ON metric_files;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_dashboard_files_text_search ON dashboard_files;--> statement-breakpoint
DROP TRIGGER IF EXISTS sync_report_files_text_search ON report_files;--> statement-breakpoint

-- Drop existing trigger functions to recreate them with screenshot_bucket_key and created_by support
DROP FUNCTION IF EXISTS sync_chats_to_text_search();--> statement-breakpoint
DROP FUNCTION IF EXISTS sync_metric_files_to_text_search();--> statement-breakpoint
DROP FUNCTION IF EXISTS sync_dashboard_files_to_text_search();--> statement-breakpoint
DROP FUNCTION IF EXISTS sync_report_files_to_text_search();--> statement-breakpoint

-- Function for chats table with screenshot_bucket_key and created_by support
CREATE OR REPLACE FUNCTION sync_chats_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    request_messages_text text;
    response_messages_text text;
    messages_text text;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Get interleaved request and response messages in chronological order
        SELECT string_agg(
            CASE 
                WHEN request_message IS NOT NULL AND request_message != '' THEN 
                    request_message
                ELSE ''
            END ||
            CASE 
                WHEN response_messages IS NOT NULL AND 
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
                WHEN response_messages IS NOT NULL THEN
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
              (response_messages IS NOT NULL AND jsonb_array_length(response_messages) > 0)
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
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'chat';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for metric_files table with screenshot_bucket_key and created_by support
CREATE OR REPLACE FUNCTION sync_metric_files_to_text_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
        )
        VALUES (
            NEW.id, 'metric_file', COALESCE(NEW.name, ''), 
            COALESCE(NEW.content ->> 'description', ''),
            NEW.organization_id, NEW.created_by,
            NEW.created_at, NEW.updated_at, NEW.deleted_at, NEW.screenshot_bucket_key
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at,
            screenshot_bucket_key = EXCLUDED.screenshot_bucket_key;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'metric_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for dashboard_files table with screenshot_bucket_key and created_by support
CREATE OR REPLACE FUNCTION sync_dashboard_files_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    metric_text TEXT := '';
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Get metric titles and descriptions from IDs in dashboard content JSON
        SELECT STRING_AGG(
            COALESCE(mf.content ->> 'name', mf.name) || E'\n' || 
            COALESCE(mf.content ->> 'description', ''), 
            E'\n\n'
        ) INTO metric_text
        FROM public.metric_files mf
        WHERE mf.id::text IN (
            -- Extract metric IDs from dashboard content JSON
            SELECT DISTINCT jsonb_extract_path_text(item_value, 'id')
            FROM jsonb_array_elements(NEW.content -> 'rows') AS row_value,
                 jsonb_array_elements(row_value -> 'items') AS item_value
            WHERE jsonb_extract_path_text(item_value, 'id') ~ '^[a-f0-9-]{36}$'
        )
        AND mf.deleted_at IS NULL;

        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
        )
        VALUES (
            NEW.id, 'dashboard_file', COALESCE(NEW.name, ''), 
            TRIM(COALESCE(NEW.content ->> 'description', '') || ' ' || COALESCE(metric_text, '')),
            NEW.organization_id, NEW.created_by,
            NEW.created_at, NEW.updated_at, NEW.deleted_at, NEW.screenshot_bucket_key
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at,
            screenshot_bucket_key = EXCLUDED.screenshot_bucket_key;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'dashboard_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for report_files table with screenshot_bucket_key and created_by support
CREATE OR REPLACE FUNCTION sync_report_files_to_text_search()
RETURNS TRIGGER AS $$
DECLARE
    cleaned_content text;
    metric_text text := '';
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Get metric names and descriptions for extracted IDs
        SELECT STRING_AGG(
            COALESCE(mf.content ->> 'name', mf.name) || E'\n' || 
            COALESCE(mf.content ->> 'description', ''), 
            E'\n\n'
        ) INTO metric_text
        FROM public.metric_files mf
        WHERE mf.id::text IN (
            -- Extract metric IDs from <metric metricId="uuid"> tags (both self-closing and full tags)
            SELECT DISTINCT matches[1]
            FROM regexp_matches(COALESCE(NEW.content, ''), '<metric[^>]*metricId="([a-f0-9-]{36})"[^>]*(?:/>|>.*?</metric>)', 'g') AS matches
            WHERE matches[1] IS NOT NULL
        )
        AND mf.deleted_at IS NULL;

        -- Remove <metric> tags and newlines from content
        cleaned_content := regexp_replace(COALESCE(NEW.content, ''), '<metric[^>]*(?:/>|>.*?</metric>)', '', 'g');
        cleaned_content := regexp_replace(cleaned_content, '\n', '', 'g');
        
        INSERT INTO public.asset_search_v2 (
            asset_id, asset_type, title, additional_text, organization_id,
            created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
        )
        VALUES (
            NEW.id, 'report_file', COALESCE(NEW.name, ''), 
            TRIM(cleaned_content || ' ' || COALESCE(metric_text, '')),
            NEW.organization_id, NEW.created_by,
            NEW.created_at, NEW.updated_at, NEW.deleted_at, NEW.screenshot_bucket_key
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            title = EXCLUDED.title,
            additional_text = EXCLUDED.additional_text,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at,
            screenshot_bucket_key = EXCLUDED.screenshot_bucket_key;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.asset_search_v2
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'report_file';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for each table
CREATE TRIGGER sync_chats_text_search
AFTER INSERT OR UPDATE OR DELETE ON chats
FOR EACH ROW EXECUTE FUNCTION sync_chats_to_text_search();

CREATE TRIGGER sync_metric_files_text_search
AFTER INSERT OR UPDATE OR DELETE ON metric_files
FOR EACH ROW EXECUTE FUNCTION sync_metric_files_to_text_search();

CREATE TRIGGER sync_dashboard_files_text_search
AFTER INSERT OR UPDATE OR DELETE ON dashboard_files
FOR EACH ROW EXECUTE FUNCTION sync_dashboard_files_to_text_search();

CREATE TRIGGER sync_report_files_text_search
AFTER INSERT OR UPDATE OR DELETE ON report_files
FOR EACH ROW EXECUTE FUNCTION sync_report_files_to_text_search();

