-- This file should undo anything in `up.sql`
-- Drop the scheduled cron job
SELECT
    cron.unschedule('delete_old_anon_users_job');

-- Drop the function to delete old anonymous users
DROP FUNCTION IF EXISTS delete_old_anon_users();