declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      OPENAI_API_KEY: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {}; 