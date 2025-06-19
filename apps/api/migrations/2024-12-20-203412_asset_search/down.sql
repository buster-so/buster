-- This file should undo anything in `up.sql`
DROP INDEX IF EXISTS pgroonga_content_index;
DROP INDEX IF EXISTS asset_search_asset_id_asset_type_idx;
DROP TABLE IF EXISTS asset_search;
DROP EXTENSION IF EXISTS pgroonga;
ALTER TABLE IF EXISTS asset_search DISABLE ROW LEVEL SECURITY;

