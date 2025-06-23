-- Your SQL goes here
ALTER TYPE asset_type_enum ADD VALUE IF NOT EXISTS 'chat';
ALTER TYPE asset_type_enum ADD VALUE IF NOT EXISTS 'metric_file';
ALTER TYPE asset_type_enum ADD VALUE IF NOT EXISTS 'dashboard_file';

ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'full_access';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'can_edit';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'can_filter';
ALTER TYPE asset_permission_role_enum ADD VALUE IF NOT EXISTS 'can_view';

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