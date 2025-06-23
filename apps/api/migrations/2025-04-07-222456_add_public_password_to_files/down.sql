-- This file should undo anything in `up.sql`

ALTER TABLE metric_files
DROP COLUMN public_password;

ALTER TABLE dashboard_files
DROP COLUMN public_password;
