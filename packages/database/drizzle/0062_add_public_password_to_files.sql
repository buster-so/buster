-- Migration: add_public_password_to_files
-- Created: 2025-04-07-222456
-- Original: 2025-04-07-222456_add_public_password_to_files

-- Add public_password column to metric_files table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metric_files' 
        AND column_name = 'public_password'
    ) THEN
        ALTER TABLE metric_files
        ADD COLUMN public_password TEXT;
    END IF;

    -- Add public_password column to dashboard_files table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dashboard_files' 
        AND column_name = 'public_password'
    ) THEN
        ALTER TABLE dashboard_files
        ADD COLUMN public_password TEXT;
    END IF;
END $$;