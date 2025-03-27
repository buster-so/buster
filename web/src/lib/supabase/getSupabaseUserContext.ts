'use server';

import { createClient } from './server';
import { signInWithAnonymousUser } from './signIn';

type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

export type UseSupabaseUserContextType = PromiseType<ReturnType<typeof getSupabaseUserContext>>;

export const getSupabaseUserContext = async (preemptiveRefreshMinutes = 5) => {
  const supabase = await createClient();

  // Get the session first
  let { data: sessionData } = await supabase.auth.getSession();

  // Check if we need to refresh the session
  if (sessionData.session) {
    const refreshedSessionData = await refreshSessionIfNeeded(
      supabase,
      sessionData.session,
      preemptiveRefreshMinutes
    );

    // If session was refreshed, get the updated session
    if (refreshedSessionData && refreshedSessionData.session) {
      // Replace the entire sessionData object to avoid type issues
      sessionData = refreshedSessionData;
    }
  }

  // Get user data
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    const { session: anonSession } = await signInWithAnonymousUser();
    return {
      user: anonSession?.user || null,
      accessToken: anonSession?.access_token
    };
  }

  const user = userData.user;
  const accessToken = sessionData.session?.access_token;
  const refreshToken = sessionData.session?.refresh_token;
  return { user, accessToken, refreshToken };
};

/**
 * Helper function to refresh the session if it's about to expire (less than 50 minutes)
 * Returns true if session was refreshed, false otherwise
 */
const refreshSessionIfNeeded = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>,
  preemptiveRefreshMinutes = 5
): Promise<false | Awaited<ReturnType<typeof supabase.auth.getSession>>['data']> => {
  // Calculate if session is about to expire (less than 50 minutes)
  const expiresAt = session.expires_at;
  if (!expiresAt) {
    return false;
  }

  const expiresAtTimestamp = expiresAt * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiresAtTimestamp - now;
  const preemptiveRefreshInMs = preemptiveRefreshMinutes * 60 * 1000;

  // If session expires in less than X minutes, refresh it
  if (timeUntilExpiry < preemptiveRefreshInMs) {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      console.error('Failed to refresh session:', error);
      return false;
    }

    // Session was successfully refreshed
    return data;
  }

  return false;
};
