// Test setup file
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { beforeAll } from 'vitest';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

beforeAll(() => {
  // Check if .env file exists and load it
  try {
    // For Node.js environments, process.env should already have the variables
    // if they're loaded properly

    // Debug: check what API key we have
    const apiKey = process.env.FIRECRAWL_API_KEY;

    if (apiKey && apiKey !== 'test-api-key') {
      // Real API key found
    } else if (apiKey === 'test-api-key') {
    } else {
      // Set fallback for unit tests
      process.env.FIRECRAWL_API_KEY = 'test-api-key';
    }
  } catch {
    // Set fallback for unit tests
    process.env.FIRECRAWL_API_KEY = 'test-api-key';
  }
});
