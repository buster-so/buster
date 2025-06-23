-- Your SQL goes here
ALTER TABLE data_sources
ADD COLUMN env VARCHAR NOT NULL DEFAULT 'dev';
