-- Migration: add_organization_id_to_thread
-- Created: 2024-11-14-155519
-- Original: 2024-11-14-155519_add_organization_id_to_thread

ALTER TABLE
    threads
ADD
    COLUMN organization_id UUID REFERENCES organizations(id);

UPDATE threads t
SET organization_id = (
    SELECT organization_id 
    FROM users_to_organizations uto
    WHERE uto.user_id = t.created_by 
    AND uto.deleted_at IS NULL
    LIMIT 1
);

ALTER TABLE threads ALTER COLUMN organization_id SET NOT NULL;