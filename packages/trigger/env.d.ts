declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      BRAINTRUST_KEY: string;
      TRIGGER_SECRET_KEY: string;
      ENVIRONMENT: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {}; 