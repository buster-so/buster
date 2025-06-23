-- Your SQL goes here

-- Function to safely drop and add foreign key constraints
-- We need this because constraint names might vary slightly depending on how they were created
-- or if they were manually named. This function finds the constraint by table and column.
CREATE OR REPLACE FUNCTION alter_fk_on_update(
    p_table_name TEXT,
    p_column_name TEXT,
    p_foreign_table_name TEXT,
    p_foreign_column_name TEXT,
    p_on_update_action TEXT -- 'CASCADE' or 'NO ACTION'
)
RETURNS VOID AS $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    -- Find the existing constraint name
    SELECT conname
    INTO v_constraint_name
    FROM pg_constraint
    WHERE conrelid = p_table_name::regclass
      AND conname LIKE p_table_name || '_' || p_column_name || '_fkey%' -- Handle potential suffix variations
      AND confrelid = p_foreign_table_name::regclass
      AND contype = 'f'
      AND p_column_name = ANY(SELECT attname FROM pg_attribute WHERE attrelid = conrelid AND attnum = ANY(conkey))
    LIMIT 1;

    -- If constraint exists, drop it
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE ' || quote_ident(p_table_name) || ' DROP CONSTRAINT ' || quote_ident(v_constraint_name);
    END IF;

    -- Add the new constraint with the specified ON UPDATE action
    EXECUTE 'ALTER TABLE ' || quote_ident(p_table_name) ||
            ' ADD CONSTRAINT ' || quote_ident(p_table_name || '_' || p_column_name || '_fkey') ||
            ' FOREIGN KEY (' || quote_ident(p_column_name) || ')' ||
            ' REFERENCES ' || quote_ident(p_foreign_table_name) || '(' || quote_ident(p_foreign_column_name) || ')' ||
            ' ON UPDATE ' || p_on_update_action || ' ON DELETE NO ACTION'; -- Assuming default ON DELETE NO ACTION
END;
$$ LANGUAGE plpgsql;

-- Apply ON UPDATE CASCADE to all identified foreign keys referencing users.id

-- Clean up orphan api_keys before altering the FK
DELETE FROM api_keys WHERE owner_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = api_keys.owner_id);
SELECT alter_fk_on_update('api_keys', 'owner_id', 'users', 'id', 'CASCADE');

-- Clean up orphan asset_permissions (created_by) before altering the FK
DELETE FROM asset_permissions WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = asset_permissions.created_by);
SELECT alter_fk_on_update('asset_permissions', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan asset_permissions (updated_by) before altering the FK
DELETE FROM asset_permissions WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = asset_permissions.updated_by);
SELECT alter_fk_on_update('asset_permissions', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan chats (created_by) before altering the FK
DELETE FROM chats WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = chats.created_by);
SELECT alter_fk_on_update('chats', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan chats (updated_by) before altering the FK
DELETE FROM chats WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = chats.updated_by);
SELECT alter_fk_on_update('chats', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan chats (publicly_enabled_by) before altering the FK
DELETE FROM chats WHERE publicly_enabled_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = chats.publicly_enabled_by);
SELECT alter_fk_on_update('chats', 'publicly_enabled_by', 'users', 'id', 'CASCADE');

-- Clean up orphan collections (created_by) before altering the FK
DELETE FROM collections WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = collections.created_by);
SELECT alter_fk_on_update('collections', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan collections (updated_by) before altering the FK
DELETE FROM collections WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = collections.updated_by);
SELECT alter_fk_on_update('collections', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan collections_to_assets (created_by) before altering the FK
DELETE FROM collections_to_assets WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = collections_to_assets.created_by);
SELECT alter_fk_on_update('collections_to_assets', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan collections_to_assets (updated_by) before altering the FK
DELETE FROM collections_to_assets WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = collections_to_assets.updated_by);
SELECT alter_fk_on_update('collections_to_assets', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan dashboard_files (created_by) before altering the FK
DELETE FROM dashboard_files
WHERE created_by IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM users WHERE users.id = dashboard_files.created_by
);
SELECT alter_fk_on_update('dashboard_files', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan dashboard_files (publicly_enabled_by) before altering the FK
DELETE FROM dashboard_files WHERE publicly_enabled_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = dashboard_files.publicly_enabled_by);
SELECT alter_fk_on_update('dashboard_files', 'publicly_enabled_by', 'users', 'id', 'CASCADE');

-- Clean up orphan dashboards (created_by) before altering the FK
DELETE FROM dashboards WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = dashboards.created_by);
SELECT alter_fk_on_update('dashboards', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan dashboards (updated_by) before altering the FK
DELETE FROM dashboards WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = dashboards.updated_by);
SELECT alter_fk_on_update('dashboards', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan data_sources (created_by) before altering the FK
DELETE FROM data_sources WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = data_sources.created_by);
SELECT alter_fk_on_update('data_sources', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan data_sources (updated_by) before altering the FK
DELETE FROM data_sources WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = data_sources.updated_by);
SELECT alter_fk_on_update('data_sources', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan datasets (created_by) before altering the FK
DELETE FROM datasets WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = datasets.created_by);
SELECT alter_fk_on_update('datasets', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan datasets (updated_by) before altering the FK
DELETE FROM datasets WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = datasets.updated_by);
SELECT alter_fk_on_update('datasets', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan messages (created_by) before altering the FK
DELETE FROM messages WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = messages.created_by);
SELECT alter_fk_on_update('messages', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan messages_deprecated (sent_by) before altering the FK
DELETE FROM messages_deprecated WHERE sent_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = messages_deprecated.sent_by);
SELECT alter_fk_on_update('messages_deprecated', 'sent_by', 'users', 'id', 'CASCADE');

-- Clean up orphan metric_files (created_by) before altering the FK
DELETE FROM metric_files WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = metric_files.created_by);
SELECT alter_fk_on_update('metric_files', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan metric_files (publicly_enabled_by) before altering the FK
DELETE FROM metric_files WHERE publicly_enabled_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = metric_files.publicly_enabled_by);
SELECT alter_fk_on_update('metric_files', 'publicly_enabled_by', 'users', 'id', 'CASCADE');

-- Clean up orphan metric_files_to_dashboard_files (created_by) before altering the FK
DELETE FROM metric_files_to_dashboard_files WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = metric_files_to_dashboard_files.created_by);
SELECT alter_fk_on_update('metric_files_to_dashboard_files', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan permission_groups (created_by) before altering the FK
DELETE FROM permission_groups WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = permission_groups.created_by);
SELECT alter_fk_on_update('permission_groups', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan permission_groups (updated_by) before altering the FK
DELETE FROM permission_groups WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = permission_groups.updated_by);
SELECT alter_fk_on_update('permission_groups', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan permission_groups_to_identities (created_by) before altering the FK
DELETE FROM permission_groups_to_identities WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = permission_groups_to_identities.created_by);
SELECT alter_fk_on_update('permission_groups_to_identities', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan permission_groups_to_identities (updated_by) before altering the FK
DELETE FROM permission_groups_to_identities WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = permission_groups_to_identities.updated_by);
SELECT alter_fk_on_update('permission_groups_to_identities', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan permission_groups_to_users (user_id) before altering the FK
DELETE FROM permission_groups_to_users WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = permission_groups_to_users.user_id);
SELECT alter_fk_on_update('permission_groups_to_users', 'user_id', 'users', 'id', 'CASCADE');

-- Clean up orphan teams (created_by) before altering the FK
DELETE FROM teams WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = teams.created_by);
SELECT alter_fk_on_update('teams', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan teams_to_users (user_id) before altering the FK
DELETE FROM teams_to_users WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = teams_to_users.user_id);
SELECT alter_fk_on_update('teams_to_users', 'user_id', 'users', 'id', 'CASCADE');

-- Clean up orphan terms (created_by) before altering the FK
DELETE FROM terms WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = terms.created_by);
SELECT alter_fk_on_update('terms', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan terms (updated_by) before altering the FK
DELETE FROM terms WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = terms.updated_by);
SELECT alter_fk_on_update('terms', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan threads_deprecated (created_by) before altering the FK
DELETE FROM threads_deprecated WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = threads_deprecated.created_by);
SELECT alter_fk_on_update('threads_deprecated', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan threads_deprecated (updated_by) before altering the FK
DELETE FROM threads_deprecated WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = threads_deprecated.updated_by);
SELECT alter_fk_on_update('threads_deprecated', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan threads_deprecated (publicly_enabled_by) before altering the FK
DELETE FROM threads_deprecated WHERE publicly_enabled_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = threads_deprecated.publicly_enabled_by);
SELECT alter_fk_on_update('threads_deprecated', 'publicly_enabled_by', 'users', 'id', 'CASCADE');

-- Clean up orphan threads_to_dashboards (added_by) before altering the FK
DELETE FROM threads_to_dashboards WHERE added_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = threads_to_dashboards.added_by);
SELECT alter_fk_on_update('threads_to_dashboards', 'added_by', 'users', 'id', 'CASCADE');

-- Clean up orphan user_favorites (user_id) before altering the FK
DELETE FROM user_favorites WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = user_favorites.user_id);
SELECT alter_fk_on_update('user_favorites', 'user_id', 'users', 'id', 'CASCADE');

-- Clean up orphan users_to_organizations (user_id) before altering the FK
DELETE FROM users_to_organizations WHERE user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = users_to_organizations.user_id);
SELECT alter_fk_on_update('users_to_organizations', 'user_id', 'users', 'id', 'CASCADE');

-- Clean up orphan users_to_organizations (created_by) before altering the FK
DELETE FROM users_to_organizations WHERE created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = users_to_organizations.created_by);
SELECT alter_fk_on_update('users_to_organizations', 'created_by', 'users', 'id', 'CASCADE');

-- Clean up orphan users_to_organizations (updated_by) before altering the FK
DELETE FROM users_to_organizations WHERE updated_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = users_to_organizations.updated_by);
SELECT alter_fk_on_update('users_to_organizations', 'updated_by', 'users', 'id', 'CASCADE');

-- Clean up orphan users_to_organizations (deleted_by) before altering the FK
DELETE FROM users_to_organizations WHERE deleted_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE users.id = users_to_organizations.deleted_by);
SELECT alter_fk_on_update('users_to_organizations', 'deleted_by', 'users', 'id', 'CASCADE');

-- Drop the helper function
DROP FUNCTION alter_fk_on_update(TEXT, TEXT, TEXT, TEXT, TEXT);
