-- Your SQL goes here
CREATE OR REPLACE FUNCTION update_user_org_attributes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users
    SET attributes = jsonb_set(
        jsonb_set(
            COALESCE(attributes, '{}'::jsonb),
            '{organization_id}',
            to_jsonb(NEW.organization_id)
        ),
        '{organization_role}',
        to_jsonb(NEW.role)
    )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_org_attributes
    AFTER INSERT OR UPDATE ON users_to_organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_org_attributes();

    -- Update existing records
    UPDATE public.users u
    SET attributes = jsonb_set(
        jsonb_set(
            COALESCE(attributes, '{}'::jsonb),
            '{organization_id}',
            to_jsonb(uto.organization_id)
        ),
        '{organization_role}',
        to_jsonb(uto.role)
    )
    FROM users_to_organizations uto
    WHERE u.id = uto.user_id;
