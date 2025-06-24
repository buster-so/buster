import env from '@/config/envClient';

const SUPABASE_CONNECTION_URL = `${env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/connect-supabase/login`;

export const connectSupabaseToBuster = async () => {
  window.location.href = SUPABASE_CONNECTION_URL;
};
