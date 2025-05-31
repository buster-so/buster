import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    workspace: ['packages/*'],
    include: ['**/*.test.ts'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
  },
})
