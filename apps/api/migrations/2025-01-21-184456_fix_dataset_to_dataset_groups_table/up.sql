-- Your SQL goes here
ALTER TABLE datasets_to_dataset_groups
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN deleted_at TIMESTAMPTZ;
