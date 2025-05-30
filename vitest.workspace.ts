import { defineWorkspace } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineWorkspace([
  // Root workspace config for shared functionality
  {
    plugins: [tsconfigPaths()],
    resolve: {
      alias: {
        // Add any global aliases you need across packages
      },
    },
    test: {
      // Global test configuration that applies to all packages
      environment: 'node',
      globals: true,
      testTimeout: 30000,
    },
  },
  // Include all individual package configs
  "./packages/*/vitest.config.ts"
])
