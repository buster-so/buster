const SUPABASE_CONNECTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/connect-supabase/login`;

export const connectSupabaseToBuster = async () => {
  window.location.href = SUPABASE_CONNECTION_URL;
};
