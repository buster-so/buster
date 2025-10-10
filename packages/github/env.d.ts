declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      GH_APP_ID: string;
      GH_APP_PRIVATE_KEY_BASE64: string;
      GH_WEBHOOK_SECRET: string;
    }
  }
}

export {};
