'use server';

import { createClient } from './server';
import { signInWithAnonymousUser } from './signIn';

type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;

export type UseSupabaseUserContextType = PromiseType<ReturnType<typeof getSupabaseUserContext>>;

export const getSupabaseUserContext = async () => {
  const supabase = await createClient();
  const [userData, sessionData] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]);

  console.log('userData', userData);

  if (!userData.data?.user) {
    const { session: anonSession } = await signInWithAnonymousUser();
    return {
      user: anonSession?.user || null,
      accessToken: anonSession?.access_token,
      expiresAt: anonSession?.expires_at,
      refreshToken: anonSession?.refresh_token
    };
  }

  const user = userData.data?.user;
  const accessToken = sessionData.data?.session?.access_token;
  const expiresAt = sessionData.data?.session?.expires_at;
  const refreshToken = sessionData.data?.session?.refresh_token;
  return { user, accessToken, expiresAt, refreshToken };
};
