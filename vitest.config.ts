import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@buster/database/connection': resolve(process.cwd(), './packages/database/src/connection'),
      '@buster/database/schema': resolve(process.cwd(), './packages/database/src/schema'),
      '@buster/database': resolve(process.cwd(), './packages/database/src'),
      '@buster/access-controls': resolve(process.cwd(), './packages/access-controls/src'),
      '@': resolve(process.cwd(), './packages/ai/src'),
      '@tools/': resolve(process.cwd(), './packages/ai/src/tools/'),
      '@agents/': resolve(process.cwd(), './packages/ai/src/agents/'),
      '@workflows/': resolve(process.cwd(), './packages/ai/src/workflows/'),
      '@utils/': resolve(process.cwd(), './packages/ai/src/utils/'),
      '@memory/': resolve(process.cwd(), './packages/ai/src/utils/memory/'),
    },
  },
  test: {
    projects: ['packages/*'],
    include: ['**/*.test.ts', '**/*.integration.test.ts', '**/*.unit.test.ts', '**/*.int.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 300000,
    // Option 1: Load specific .env file using loadEnv
    env: loadEnv('', process.cwd(), ''),
  },
})
