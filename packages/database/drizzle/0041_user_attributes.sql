-- Migration: user_attributes
-- Created: 2025-01-17-180051
-- Original: 2025-01-17-180051_user_attributes

ALTER TABLE users
ADD COLUMN attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION set_user_attributes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.attributes = jsonb_build_object(
    'user_id', NEW.id::text,
    'user_email', NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_attributes_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_user_attributes();

UPDATE users 
SET attributes = jsonb_build_object(
  'user_id', id::text,
  'user_email', email
);