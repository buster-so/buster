import { attachListeners } from '@mastra/evals';
import { beforeAll } from 'vitest';
import { mastra } from '../src/index'; // Assuming mastra instance is exported from src/index.ts

beforeAll(async () => {
  // Store evals in Mastra Storage (requires storage to be enabled)
  await attachListeners(mastra);
});
