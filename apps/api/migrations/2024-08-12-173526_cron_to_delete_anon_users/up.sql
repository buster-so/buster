-- Your SQL goes here
-- Create a function to delete old anonymous users
CREATE
OR REPLACE FUNCTION delete_old_anon_users() RETURNS void AS $$ BEGIN
DELETE FROM
    public.users
WHERE
    id IN (
        SELECT
            public.users.id
        FROM
            public.users
            JOIN auth.users ON public.users.id = auth.users.id
        WHERE
            auth.users.is_anonymous IS TRUE
            AND auth.users.created_at < NOW() - INTERVAL '2 days'
    );

DELETE FROM
    auth.users
WHERE
    is_anonymous IS TRUE
    AND created_at < NOW() - INTERVAL '2 days';

END;

$$ LANGUAGE plpgsql;

-- Create a cron job to run the delete_old_anon_users function daily at 3 AM
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT
    cron.schedule(
        'delete_old_anon_users_job',
        '0 3 * * *',
        'SELECT delete_old_anon_users()'
    );