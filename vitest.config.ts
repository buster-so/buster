import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  test: {
    workspace: ['packages/*'],
    include: ['**/*.test.ts', '**/*.integration.test.ts', '**/*.unit.test.ts', '**/*.int.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    // Option 1: Load specific .env file using loadEnv
    env: loadEnv('', process.cwd(), ''),
  },
})
