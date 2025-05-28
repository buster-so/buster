'use server';

import type { User, Session } from '@supabase/supabase-js';
import type { createClient } from './server';
import type { Database } from './database.types';
import { signInWithAnonymousUser } from './signIn';

type PromiseType<T extends Promise<unknown>> = T extends Promise<infer U> ? U : never;

export type UseSupabaseUserContextType = PromiseType<ReturnType<typeof getSupabaseUserContext>>;

export const getSupabaseUserContext = async (supabase: ReturnType<typeof createClient>) => {
  let userContext: { user: User | null; session: Session | null } = {
    user: null,
    session: null
  };

  try {
    let sessionData = await supabase.auth.getSession();

    // If no session exists, try to refresh
    if (!sessionData.session) {
      const refreshedSessionData = await supabase.auth.refreshSession();

      // If session was refreshed, get the updated session
      if (refreshedSessionData?.session) {
        // Replace the entire sessionData object to avoid type issues
        sessionData = refreshedSessionData;
      }
    }

    // If we still don't have a session, sign in anonymously
    if (!sessionData.session) {
      const anonymousSignInResult = await signInWithAnonymousUser(supabase);
      if (anonymousSignInResult.data?.session) {
        sessionData = {
          data: {
            session: anonymousSignInResult.data.session,
            user: anonymousSignInResult.data.user
          },
          error: null
        };
      }
    }

    userContext = {
      user: sessionData.data.session?.user || null,
      session: sessionData.data.session || null
    };
  } catch (error) {
    console.error('Error getting user context:', error);
  }

  return userContext;
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
