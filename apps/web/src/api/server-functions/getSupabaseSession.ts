import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';
import { createServerFn } from '@tanstack/react-start';
import type { SimplifiedSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { getSupabaseServerClient } from '@/integrations/supabase/server';
import { isServer } from '@/lib/window';
import { isTokenExpired } from '../auth_helpers/expiration-helpers';

export const extractSimplifiedSupabaseSession = async (
  supabaseClient: SupabaseClient
): Promise<{
  data: SimplifiedSupabaseSession;
  error: null | AuthError;
}> => {
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  const session = sessionData.session;
  return {
    data: {
      accessToken: session?.access_token ?? '',
      expiresAt: session?.expires_at ?? 0,
      expiresIn: session?.expires_in ?? 0,
      isExpired: isTokenExpired(session?.expires_at),
    } satisfies SimplifiedSupabaseSession,
    error: sessionError,
  };
};

export const getSupabaseSessionServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await extractSimplifiedSupabaseSession(supabase);
    return {
      data,
      error,
    };
  } catch (error) {
    // Final catch-all for any unhandled errors
    if (error instanceof Error && error.message.includes('ERR_HTTP_HEADERS_SENT')) {
      console.warn('Headers already sent error in session handler, returning empty session');
      return {
        data: {
          accessToken: '',
          expiresAt: 0,
          expiresIn: 0,
          isExpired: true,
        } satisfies SimplifiedSupabaseSession,
        error: null,
      };
    }
    throw error;
  }
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
