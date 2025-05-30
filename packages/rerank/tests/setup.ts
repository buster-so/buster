import { config } from 'dotenv';
import { vi } from 'vitest';

// Load environment variables from .env file for tests
config();

// Set default test environment variables if not provided
if (!process.env.RERANK_API_KEY) {
  process.env.RERANK_API_KEY = 'test-api-key';
}
if (!process.env.RERANK_BASE_URL) {
  process.env.RERANK_BASE_URL = 'https://api.cohere.ai/v1/rerank';
}
if (!process.env.RERANK_MODEL) {
  process.env.RERANK_MODEL = 'rerank-english-v3.0';
}

// Global test utilities
global.console = {
  ...console,
  error: vi.fn(console.error),
};
