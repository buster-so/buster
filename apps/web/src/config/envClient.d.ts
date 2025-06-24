export interface ClientEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_API2_URL: string;
  NEXT_PUBLIC_WEB_SOCKET_URL: string;
  NEXT_PUBLIC_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_POSTHOG_KEY?: string;
  NEXT_PUBLIC_POSTHOG_HOST?: string;
  NEXT_PUBLIC_USER?: string;
  NEXT_PUBLIC_USER_PASSWORD?: string;
}

// Client-only env for frontend usage
declare const clientEnv: ClientEnv;
export default clientEnv;
