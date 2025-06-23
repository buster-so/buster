CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    old_user_id UUID;
    user_email TEXT;
BEGIN
    -- Set user_email to NEW.email if present, otherwise generate a random UUID email
    user_email := COALESCE(NEW.email, (gen_random_uuid())::TEXT || '@busteranon.com');

    -- Check if the email already exists in public.users
    SELECT id INTO old_user_id FROM public.users WHERE email = user_email;
    
    IF FOUND THEN
        -- Update the existing user with the new id
        UPDATE public.users
        SET id = NEW.id
        WHERE email = user_email;
        
        -- Update asset_permissions table
        UPDATE public.asset_permissions
        SET identity_id = NEW.id
        WHERE identity_id = old_user_id AND identity_type = 'user';

        -- Update permission_groups_to_identities table
        UPDATE public.permission_groups_to_identities
        SET identity_id = NEW.id
        WHERE identity_id = old_user_id AND identity_type = 'user';
    ELSE
        -- Insert a new user if the email doesn't exist
        INSERT INTO public.users (id, email)
        VALUES (NEW.id, user_email);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();