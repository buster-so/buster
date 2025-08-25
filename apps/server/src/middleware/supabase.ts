import { getSecret } from '@buster/secrets';
import { createClient } from '@supabase/supabase-js';

export const createSupabaseClient = async () => {
  const supabaseUrl = await getSecret('SUPABASE_URL');
  const supabaseServiceRoleKey = await getSecret('SUPABASE_SERVICE_ROLE_KEY');

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  return supabase;
};

let globalSupabase: Awaited<ReturnType<typeof createSupabaseClient>> | null = null;
let initPromise: Promise<void> | null = null;

const initSupabase = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      globalSupabase = await createSupabaseClient();
    })();
  }
  return initPromise;
};

export const getSupabaseClient = async () => {
  if (!globalSupabase) {
    await initSupabase();
  }
  if (!globalSupabase) {
    throw new Error('Failed to initialize Supabase client');
  }
  return globalSupabase;
};
