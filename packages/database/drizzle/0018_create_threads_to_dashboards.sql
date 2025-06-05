-- Migration: create_threads_to_dashboards
-- Created: 2024-06-18-230440
-- Original: 2024-06-18-230440_create_threads_to_dashboards

create table threads_to_dashboards (
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    added_by UUID NOT NULL references users(id) on update cascade,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ,
    primary key (thread_id, dashboard_id)
);

-- Enable Row Level Security
ALTER TABLE threads_to_dashboards ENABLE ROW LEVEL SECURITY;