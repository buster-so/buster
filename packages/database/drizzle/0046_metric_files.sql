-- Migration: metric_files
-- Created: 2025-01-27-235752
-- Original: 2025-01-27-235752_metric_files

CREATE TABLE metric_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    content JSONB NOT NULL,
    verification verification_enum NOT NULL DEFAULT 'notRequested',
    evaluation_obj JSONB,
    evaluation_summary TEXT,
    evaluation_score FLOAT,
    organization_id UUID NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes
CREATE INDEX metric_files_organization_id_idx ON metric_files(organization_id);
CREATE INDEX metric_files_created_by_idx ON metric_files(created_by);
CREATE INDEX metric_files_deleted_at_idx ON metric_files(deleted_at);