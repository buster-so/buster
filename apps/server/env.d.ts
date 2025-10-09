declare global {
    namespace NodeJS {
      interface ProcessEnv {
        DATABASE_URL: string;
        SERVER_PORT: string;
        SUPABASE_URL: string;
        SUPABASE_SERVICE_ROLE_KEY: string;
        ELECTRIC_PROXY_URL: string;
        ELECTRIC_SOURCE_ID: string;
        ELECTRIC_SECRET: string;
        TRIGGER_SECRET_KEY: string;
        SLACK_CLIENT_ID: string;
        SLACK_CLIENT_SECRET: string;
        SLACK_SIGNING_SECRET: string;
        SLACK_APP_SUPPORT_URL: string;
        SERVER_URL: string;
        NODE_ENV?: 'development' | 'production' | 'test';
        VITE_PUBLIC_URL: string;
      }
    }
  }
  
  export {}; 