declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      // Add CLI-specific environment variables here
      API_URL?: string;
      AUTH_TOKEN?: string;
    }
  }
}

export {};
