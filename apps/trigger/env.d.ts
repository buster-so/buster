declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      BRAINTRUST_KEY: string;
      TRIGGER_SECRET_KEY: string;
      ENVIRONMENT: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      BUSTER_URL: string;
      BUSTER_ALERT_CHANNEL_TOKEN?: string;
      BUSTER_ALERT_CHANNEL_ID?: string;
      TURBOPUFFER_API_KEY?: string;
    }
  }
}

export {};
