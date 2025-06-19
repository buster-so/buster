-- This file should undo anything in `up.sql`
ALTER TABLE datasets
DROP COLUMN yml_file;
