import baseConfig from '@buster/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'node',
      globals: true,
    },
  })
);