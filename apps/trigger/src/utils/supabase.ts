import { type User, createClient } from '@supabase/supabase-js';

const createSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not set');
  }

  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  return supabase;
};

let globalSupabase: ReturnType<typeof createSupabaseClient> | null = null;

export const getSupabaseClient = () => {
  if (!globalSupabase) {
    globalSupabase = createSupabaseClient();
  }
  return globalSupabase;
};

export const getSupabaseCookieKey = (): string => {
  const supabase = getSupabaseClient();
  const supabaseCookieKey = (supabase as unknown as { storageKey: string }).storageKey;
  return supabaseCookieKey;
};

export const getSupabaseUser = async (jwtToken: string): Promise<User | null> => {
  const supabase = getSupabaseClient();
  const supabaseUser = await supabase.auth.getUser(jwtToken);
  return supabaseUser.data.user;
};

// export const getSupabaseAccessToken = async (userId: string) => {
//   const supabase = getSupabaseClient();

//   //
// };
