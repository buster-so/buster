-- Migration: create_threads
-- Created: 2024-06-03-223321
-- Original: 2024-06-03-223321_create_threads

create table threads(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL references users(id) on update cascade,
    updated_by UUID NOT NULL references users(id) on update cascade,
    publicly_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    publicly_enabled_by UUID references users(id) on update cascade,
    public_expiry_date TIMESTAMPTZ,
    password_secret_id UUID,
    state_message_id UUID,
    parent_thread_id UUID references threads(id) on update cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

alter table
    threads enable row level security;