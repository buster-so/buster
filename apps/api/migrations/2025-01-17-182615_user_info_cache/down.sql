-- This file should undo anything in `up.sql`
DROP TRIGGER IF EXISTS sync_user_org_attributes ON users_to_organizations;
DROP FUNCTION IF EXISTS update_user_org_attributes();
