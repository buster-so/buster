-- Migration: add_new_enums_to_sharing_and_modify_asset_tables
-- Created: 2025-03-06-232923
-- Original: 2025-03-06-232923_add_new_enums_to_sharing_and_modify_asset_tables

-- Add new enum values first
ALTER TYPE asset_type_enum ADD VALUE IF NOT EXISTS 'chat';
ALTER TYPE asset_type_enum ADD VALUE IF NOT EXISTS 'metric_file';
ALTER TYPE asset_type_enum ADD VALUE IF NOT EXISTS 'dashboard_file';

ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'full_access';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'can_edit';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'can_filter';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'can_view';

-- Commit the enum changes before using them
COMMIT;

-- Now we can safely use the new enum values in table modifications
-- Add public sharing fields to chats table
ALTER TABLE chats
ADD COLUMN publicly_accessible boolean NOT NULL DEFAULT false,
ADD COLUMN publicly_enabled_by uuid NULL REFERENCES users(id),
ADD COLUMN public_expiry_date timestamp with time zone NULL;

-- Add public sharing fields to metric_files table
ALTER TABLE metric_files
ADD COLUMN publicly_accessible boolean NOT NULL DEFAULT false,
ADD COLUMN publicly_enabled_by uuid NULL REFERENCES users(id),
ADD COLUMN public_expiry_date timestamp with time zone NULL;

-- Add public sharing fields to dashboard_files table
ALTER TABLE dashboard_files
ADD COLUMN publicly_accessible boolean NOT NULL DEFAULT false,
ADD COLUMN publicly_enabled_by uuid NULL REFERENCES users(id),
ADD COLUMN public_expiry_date timestamp with time zone NULL;

-- Add version_history column to metric_files table
ALTER TABLE metric_files
ADD COLUMN version_history JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Add version_history column to dashboard_files table
ALTER TABLE dashboard_files
ADD COLUMN version_history JSONB NOT NULL DEFAULT '{}'::jsonb;