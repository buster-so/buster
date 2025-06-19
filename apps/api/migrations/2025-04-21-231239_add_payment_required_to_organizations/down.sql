-- This file should undo anything in `up.sql`

ALTER TABLE organizations
DROP COLUMN payment_required;
