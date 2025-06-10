import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

// Note: Using dynamic import to avoid ES module issues
export default defineConfig(async () => {
  const { default: tsconfigPaths } = await import('vite-tsconfig-paths')
  
  return {
    plugins: [tsconfigPaths()],
    test: {
      projects: ['packages/*', 'trigger', 'server'],
      include: ['**/*.test.ts', '**/*.integration.test.ts', '**/*.unit.test.ts', '**/*.int.test.ts'],
      globals: true,
      environment: 'node',
      testTimeout: 300000,
      env: loadEnv('', process.cwd(), ''),
    },
  }
})
