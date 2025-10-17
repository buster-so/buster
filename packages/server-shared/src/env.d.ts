declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VITE_PUBLIC_URL: string;
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
    }
  }
}

export {};
