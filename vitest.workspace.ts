import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./packages/web-tools/vitest.config.ts",
  "./packages/data-source/vitest.config.ts",
  "./packages/ai/vitest.config.ts",
  "./packages/stored-values/vitest.config.ts"
])
