-- This file should undo anything in `up.sql`
DROP TRIGGER IF EXISTS set_user_attributes_trigger ON users;
DROP FUNCTION IF EXISTS set_user_attributes();
ALTER TABLE users DROP COLUMN attributes;
