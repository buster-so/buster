-- Your SQL goes here
CREATE TABLE collections_to_assets (
    collection_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    asset_type asset_type_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    created_by UUID NOT NULL references users(id) on update cascade,
    updated_by UUID NOT NULL references users(id) on update cascade,
    PRIMARY KEY (collection_id, asset_id, asset_type)
);

-- Enable Row Level Security
ALTER TABLE
    collections_to_assets ENABLE ROW LEVEL SECURITY;