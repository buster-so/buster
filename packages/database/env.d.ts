declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      SUPABASE_URL: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      SUPABASE_ANON_KEY: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};
