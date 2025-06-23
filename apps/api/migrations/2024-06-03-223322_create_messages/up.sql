-- Your SQL goes here
create type message_feedback_enum as enum ('positive', 'negative');

create type verification_enum as enum (
    'verified',
    'backlogged',
    'inReview',
    'requested',
    'notRequested'
);

create table messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    sent_by UUID NOT NULL references users(id) on update cascade,
    message TEXT NOT NULL,
    responses JSONB,
    code TEXT,
    context JSONB,
    title TEXT,
    feedback message_feedback_enum,
    verification verification_enum NOT NULL DEFAULT 'notRequested',
    dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
    chart_config JSONB DEFAULT '{}',
    chart_recommendations JSONB DEFAULT '{}',
    time_frame TEXT,
    data_metadata JSONB,
    draft_session_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ,
    draft_state JSONB,
    summary_question TEXT
);

-- Enable Row Level Security
ALTER TABLE
    messages ENABLE ROW LEVEL SECURITY;