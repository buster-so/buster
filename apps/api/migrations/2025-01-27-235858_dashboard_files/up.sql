-- Your SQL goes here
CREATE TABLE dashboard_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    content JSONB NOT NULL,
    filter VARCHAR,
    organization_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX dashboard_files_organization_id_idx ON dashboard_files(organization_id);
CREATE INDEX dashboard_files_created_by_idx ON dashboard_files(created_by);
CREATE INDEX dashboard_files_deleted_at_idx ON dashboard_files(deleted_at);
