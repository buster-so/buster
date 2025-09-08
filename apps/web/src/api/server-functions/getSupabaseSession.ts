import { createServerFn } from '@tanstack/react-start';
import { getSupabaseServerClient } from '@/integrations/supabase/server';

export const getSupabaseSessionServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const [sessionData] = await Promise.all([supabase.auth.getSession()]);
  const session = sessionData.data?.session;
  const sessionError = sessionData.error;
  const pickedSession = {
    access_token: session?.access_token,
    expires_at: session?.expires_at,
    expires_in: session?.expires_in,
  };

  return {
    data: {
      session: pickedSession,
    },
    error: sessionError,
  };
});

export const getSupabaseUserServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const pickedUser = {
    id: userData.user?.id ?? '',
    email: userData.user?.email ?? '',
    is_anonymous: userData.user?.is_anonymous ?? true,
  };

  return {
    data: {
      user: pickedUser,
    },
    error: userError,
  };
});
