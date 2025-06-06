-- Migration: add_triggers_for_assets_to_search
-- Created: 2025-03-25-200823
-- Original: 2025-03-25-200823_add_triggers_for_assets_to_search

-- Function for metric_files
CREATE OR REPLACE FUNCTION sync_metric_files_to_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        insert into public.asset_search (
            asset_id, asset_type, content, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'metric', NEW.name,
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            content = EXCLUDED.content,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE asset_search
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'metric';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for dashboard_files
CREATE OR REPLACE FUNCTION sync_dashboard_files_to_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        insert into public.asset_search (
            asset_id, asset_type, content, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'dashboard', NEW.name,
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            content = EXCLUDED.content,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE asset_search
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'dashboard';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function for collections
CREATE OR REPLACE FUNCTION sync_collections_to_search()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        insert into public.asset_search (
            asset_id, asset_type, content, organization_id,
            created_at, updated_at, deleted_at
        )
        VALUES (
            NEW.id, 'collection', NEW.name,
            NEW.organization_id,
            NEW.created_at, NEW.updated_at, NEW.deleted_at
        )
        ON CONFLICT (asset_id, asset_type) DO UPDATE SET
            content = EXCLUDED.content,
            updated_at = EXCLUDED.updated_at,
            deleted_at = EXCLUDED.deleted_at;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE asset_search
        SET deleted_at = NOW()
        WHERE asset_id = OLD.id AND asset_type = 'collection';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_metric_files_search ON metric_files;
DROP TRIGGER IF EXISTS sync_dashboard_files_search ON dashboard_files;
DROP TRIGGER IF EXISTS sync_collections_search ON collections;
DROP TRIGGER IF EXISTS sync_collection_assets_search ON collections_to_assets;

-- Create triggers for each table
CREATE TRIGGER sync_metric_files_search
AFTER INSERT OR UPDATE OR DELETE ON metric_files
FOR EACH ROW EXECUTE FUNCTION sync_metric_files_to_search();

CREATE TRIGGER sync_dashboard_files_search
AFTER INSERT OR UPDATE OR DELETE ON dashboard_files
FOR EACH ROW EXECUTE FUNCTION sync_dashboard_files_to_search();

CREATE TRIGGER sync_collections_search
AFTER INSERT OR UPDATE OR DELETE ON collections
FOR EACH ROW EXECUTE FUNCTION sync_collections_to_search();

-- Populate existing data
insert into public.asset_search (
    asset_id, asset_type, content, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'metric', name,
    organization_id,
    created_at, updated_at, deleted_at
FROM metric_files
WHERE deleted_at IS NULL
ON CONFLICT (asset_id, asset_type) DO NOTHING;

insert into public.asset_search (
    asset_id, asset_type, content, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'dashboard', name,
    organization_id,
    created_at, updated_at, deleted_at
FROM dashboard_files
WHERE deleted_at IS NULL
ON CONFLICT (asset_id, asset_type) DO NOTHING;

insert into public.asset_search (
    asset_id, asset_type, content, organization_id,
    created_at, updated_at, deleted_at
)
SELECT 
    id, 'collection', name,
    organization_id,
    created_at, updated_at, deleted_at
FROM collections
WHERE deleted_at IS NULL
ON CONFLICT (asset_id, asset_type) DO NOTHING;