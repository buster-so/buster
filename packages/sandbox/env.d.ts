declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      DAYTONA_API_KEY?: string;
    }
  }
}

export {};
