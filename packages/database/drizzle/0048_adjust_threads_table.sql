-- Migration: adjust_threads_table
-- Created: 2025-01-27-390057
-- Original: 2025-01-27-390057_adjust_threads_table

-- Rename existing threads table to threads_deprecated
ALTER TABLE threads RENAME TO threads_deprecated;

-- Create new threads table with updated schema
CREATE TABLE chats(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);

-- Create indexes for common query patterns
CREATE INDEX chats_organization_id_idx ON chats(organization_id);
CREATE INDEX chats_created_by_idx ON chats(created_by);
CREATE INDEX chats_created_at_idx ON chats(created_at);