import { createClient } from './server';

type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never;
export type UseSupabaseContextType = PromiseType<ReturnType<typeof getSupabaseServerContext>>;

export const getSupabaseServerContext = async () => {
  const supabase = await createClient();
  const [userData, sessionData] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession()
  ]);

  const user = userData.data?.user;
  const accessToken = sessionData.data?.session?.access_token;
  const expiresAt = sessionData.data?.session?.expires_at;
  const refreshToken = sessionData.data?.session?.refresh_token!;

  return { user, accessToken, refreshToken, expiresAt };
};
