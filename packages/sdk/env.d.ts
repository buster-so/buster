declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      // SDK doesn't require any environment variables by default
      // Client applications will provide configuration
    }
  }
}

export {};
