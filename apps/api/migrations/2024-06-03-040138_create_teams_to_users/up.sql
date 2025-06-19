-- Your SQL goes here
create type team_role_enum as enum ('owner', 'member', 'admin');

CREATE TABLE teams_to_users (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL references users(id) on update cascade on delete cascade,
    role team_role_enum NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at timestamptz not null default now(),
    deleted_at TIMESTAMPTZ,
    primary key (team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE
    teams_to_users ENABLE ROW LEVEL SECURITY;