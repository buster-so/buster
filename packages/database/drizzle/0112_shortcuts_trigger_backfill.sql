-- Create Buster system user if it doesn't exist
DO $$ 
DECLARE
    buster_user_id uuid;
BEGIN
    -- Check if Buster user already exists
    SELECT id INTO buster_user_id
    FROM users
    WHERE email = 'support@buster.so';
    
    -- If not exists, create the user
    IF buster_user_id IS NULL THEN
        INSERT INTO users (
            email,
            name,
            created_at,
            updated_at
        ) VALUES (
            'support@buster.so',
            'Buster',
            now(),
            now()
        )
        RETURNING id INTO buster_user_id;
    END IF;
END $$;

--> statement-breakpoint

-- Function to add default shortcuts for an organization
CREATE OR REPLACE FUNCTION add_default_shortcuts_for_org(org_id uuid)
RETURNS void AS $$
DECLARE
    buster_user_id uuid;
BEGIN
    -- Get the Buster user ID
    SELECT id INTO buster_user_id
    FROM users
    WHERE email = 'support@buster.so';
    
    -- Insert default shortcuts if they don't exist
    -- quick shortcut
    INSERT INTO shortcuts (name, instructions, created_by, organization_id, share_with_workspace, created_at, updated_at)
    VALUES (
        'quick',
        'Quickly answer my request as fast as possible. Use as little prep, thoughts, validation as possible. Again, this should be fulfilled as quickly as possible: ',
        buster_user_id,
        org_id,
        true,
        now(),
        now()
    )
    ON CONFLICT (name, organization_id) WHERE share_with_workspace = true
    DO NOTHING;
    
    -- deep-dive shortcut
    INSERT INTO shortcuts (name, instructions, created_by, organization_id, share_with_workspace, created_at, updated_at)
    VALUES (
        'deep-dive',
        'Do a deep dive and build me a thorough report. Find meaningful insights and thoroughly explore. If I have a specific topic in mind, I''ll include it here: ',
        buster_user_id,
        org_id,
        true,
        now(),
        now()
    )
    ON CONFLICT (name, organization_id) WHERE share_with_workspace = true
    DO NOTHING;
    
    -- csv shortcut
    INSERT INTO shortcuts (name, instructions, created_by, organization_id, share_with_workspace, created_at, updated_at)
    VALUES (
        'csv',
        'Return a table/list that I can export as a CSV. Here is my request: ',
        buster_user_id,
        org_id,
        true,
        now(),
        now()
    )
    ON CONFLICT (name, organization_id) WHERE share_with_workspace = true
    DO NOTHING;
    
    -- suggestions shortcut
    INSERT INTO shortcuts (name, instructions, created_by, organization_id, share_with_workspace, created_at, updated_at)
    VALUES (
        'suggestions',
        'What specific questions I can ask that may be of value? The more specific and high-impact the better. If I have a specific topic in mind, I''ll include it here: ',
        buster_user_id,
        org_id,
        true,
        now(),
        now()
    )
    ON CONFLICT (name, organization_id) WHERE share_with_workspace = true
    DO NOTHING;
    
    -- dashboard shortcut
    INSERT INTO shortcuts (name, instructions, created_by, organization_id, share_with_workspace, created_at, updated_at)
    VALUES (
        'dashboard',
        'Build me a dashboard. If I have a specific topic in mind, I''ll include it here: ',
        buster_user_id,
        org_id,
        true,
        now(),
        now()
    )
    ON CONFLICT (name, organization_id) WHERE share_with_workspace = true
    DO NOTHING;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

-- Backfill existing organizations with default shortcuts
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN 
        SELECT id 
        FROM organizations 
        WHERE deleted_at IS NULL
    LOOP
        PERFORM add_default_shortcuts_for_org(org_record.id);
    END LOOP;
END $$;

--> statement-breakpoint

-- Create trigger function for new organizations
CREATE OR REPLACE FUNCTION add_default_shortcuts_on_org_create()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM add_default_shortcuts_for_org(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint

-- Create trigger on organization insert
DROP TRIGGER IF EXISTS add_default_shortcuts_trigger ON organizations;
CREATE TRIGGER add_default_shortcuts_trigger
AFTER INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION add_default_shortcuts_on_org_create();