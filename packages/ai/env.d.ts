declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BRAINTRUST_KEY: string;
      PATH: string;
      HOME: string;
      OPENAI_API_KEY: string;
      ANTHROPIC_API_KEY: string;
      AI_GATEWAY_API_KEY: string;
      ENVIRONMENT: string;
      DATABASE_URL: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }
}

export {};
