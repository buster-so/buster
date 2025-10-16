declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      TURBOPUFFER_API_KEY?: string;
    }
  }
}

export {};
