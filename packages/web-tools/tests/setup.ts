// Test setup file
import { beforeAll } from 'vitest';

beforeAll(() => {
  // Environment variables are now loaded by Vite's loadEnv in vitest.config.ts

  // Set fallback API key for unit tests if none exists
  if (!process.env.FIRECRAWL_API_KEY) {
    process.env.FIRECRAWL_API_KEY = 'test-api-key';
  }
});
