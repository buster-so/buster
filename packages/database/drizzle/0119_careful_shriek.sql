-- Step 1: Truncate the asset_search_v2 table to start fresh
TRUNCATE TABLE "asset_search_v2";--> statement-breakpoint

-- Step 2: Add the created_by column as NOT NULL (since table is empty)
ALTER TABLE "asset_search_v2" ADD COLUMN if not exists "created_by" uuid NOT NULL;--> statement-breakpoint

-- Step 3: Add the foreign key constraint for created_by
ALTER TABLE "asset_search_v2" ADD CONSTRAINT "asset_search_v2_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Step 4: Repopulate chats with enhanced message content
INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
)
SELECT 
    c.id,
    'chat'::asset_type_enum,
    COALESCE(c.title, ''),
    (
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
        FROM public.messages
        WHERE chat_id = c.id 
          AND deleted_at IS NULL 
          AND (
              (request_message IS NOT NULL AND request_message != '') 
              OR 
              (response_messages IS NOT NULL AND jsonb_array_length(response_messages) > 0)
          )
    ),
    c.organization_id,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.deleted_at,
    c.screenshot_bucket_key
FROM public.chats c
WHERE c.created_by IS NOT NULL;--> statement-breakpoint

-- Step 5: Repopulate metric_files with enhanced content
INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
)
SELECT 
    mf.id,
    'metric_file'::asset_type_enum,
    COALESCE(mf.name, ''),
    COALESCE(mf.content ->> 'description', ''),
    mf.organization_id,
    mf.created_by,
    mf.created_at,
    mf.updated_at,
    mf.deleted_at,
    mf.screenshot_bucket_key
FROM public.metric_files mf
WHERE mf.created_by IS NOT NULL;--> statement-breakpoint

-- Step 6: Repopulate dashboard_files with enhanced content including metric information
INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
)
SELECT 
    df.id,
    'dashboard_file'::asset_type_enum,
    COALESCE(df.name, ''),
    TRIM(COALESCE(df.content ->> 'description', '') || ' ' || COALESCE((
        -- Get metric titles and descriptions from IDs in dashboard content JSON
        SELECT STRING_AGG(
            COALESCE(mf.content ->> 'name', mf.name) || E'\n' || 
            COALESCE(mf.content ->> 'description', ''), 
            E'\n\n'
        )
        FROM public.metric_files mf
        WHERE mf.id::text IN (
            -- Extract metric IDs from dashboard content JSON
            SELECT DISTINCT jsonb_extract_path_text(item_value, 'id')
            FROM jsonb_array_elements(df.content -> 'rows') AS row_value,
                 jsonb_array_elements(row_value -> 'items') AS item_value
            WHERE jsonb_extract_path_text(item_value, 'id') ~ '^[a-f0-9-]{36}$'
        )
        AND mf.deleted_at IS NULL
    ), '')),
    df.organization_id,
    df.created_by,
    df.created_at,
    df.updated_at,
    df.deleted_at,
    df.screenshot_bucket_key
FROM public.dashboard_files df
WHERE df.created_by IS NOT NULL;--> statement-breakpoint

-- Step 7: Repopulate report_files with enhanced content including metric information
INSERT INTO public.asset_search_v2 (
    asset_id, asset_type, title, additional_text, organization_id,
    created_by, created_at, updated_at, deleted_at, screenshot_bucket_key
)
SELECT 
    rf.id,
    'report_file'::asset_type_enum,
    COALESCE(rf.name, ''),
    TRIM(
        -- Remove <metric> tags and newlines from content
        regexp_replace(
            regexp_replace(COALESCE(rf.content, ''), '<metric[^>]*(?:/>|>.*?</metric>)', '', 'g'),
            '\n', '', 'g'
        ) || ' ' || 
        COALESCE((
            -- Get metric names and descriptions for extracted IDs
            SELECT STRING_AGG(
                COALESCE(mf.content ->> 'name', mf.name) || E'\n' || 
                COALESCE(mf.content ->> 'description', ''), 
                E'\n\n'
            )
            FROM public.metric_files mf
            WHERE mf.id::text IN (
                -- Extract metric IDs from <metric metricId="uuid"> tags (both self-closing and full tags)
                SELECT DISTINCT matches[1]
                FROM regexp_matches(COALESCE(rf.content, ''), '<metric[^>]*metricId="([a-f0-9-]{36})"[^>]*(?:/>|>.*?</metric>)', 'g') AS matches
                WHERE matches[1] IS NOT NULL
            )
            AND mf.deleted_at IS NULL
        ), '')
    ),
    rf.organization_id,
    rf.created_by,
    rf.created_at,
    rf.updated_at,
    rf.deleted_at,
    rf.screenshot_bucket_key
FROM public.report_files rf
WHERE rf.created_by IS NOT NULL;