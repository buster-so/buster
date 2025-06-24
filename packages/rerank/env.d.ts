declare global {
  namespace NodeJS {
    interface ProcessEnv {
      RERANK_API_KEY: string;
      RERANK_MODEL: string;
      RERANK_BASE_URL: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {}; 