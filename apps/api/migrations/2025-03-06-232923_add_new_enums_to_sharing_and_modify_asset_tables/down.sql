-- This file should undo anything in `up.sql`
-- Remove public sharing fields from dashboard_files table
ALTER TABLE dashboard_files
DROP COLUMN public_expiry_date,
DROP COLUMN publicly_enabled_by,
DROP COLUMN publicly_accessible;

-- Remove public sharing fields from metric_files table
ALTER TABLE metric_files
DROP COLUMN public_expiry_date,
DROP COLUMN publicly_enabled_by,
DROP COLUMN publicly_accessible;

-- Remove public sharing fields from chats table
ALTER TABLE chats
DROP COLUMN public_expiry_date,
DROP COLUMN publicly_enabled_by,
DROP COLUMN publicly_accessible;

-- Remove added enum values from asset_permission_role_enum
DELETE FROM pg_enum
WHERE enumlabel IN ('owner', 'full_access', 'can_edit', 'can_filter', 'can_view')
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'asset_permission_role_enum');

-- Remove added enum value from asset_type_enum
DELETE FROM pg_enum 
WHERE enumlabel = 'chat'
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'asset_type_enum');

DELETE FROM pg_enum 
WHERE enumlabel = 'metric_file'
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'asset_type_enum');

DELETE FROM pg_enum 
WHERE enumlabel = 'dashboard_file'
AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'asset_type_enum');
