import globals from 'globals';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Still need FlatCompat for Next.js and Storybook configs that haven't been migrated to flat config yet
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Global ignores
  {
    ignores: [
      '**/*.test.*',
      '**/*.stories.*',
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'dist/**',
      'eslint.config.*',
      'playwright-test/*',
      'playwright-report/*',
      'coverage/*'
    ]
  },

  // Base JavaScript recommendations
  js.configs.recommended,

  // Next.js and Storybook configs (still need compat wrapper)
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'plugin:storybook/recommended'),

  // Main application configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'react/no-array-index-key': 'off',
      'react-hooks/exhaustive-deps': 'off',
    }
  },

  // Test and story files configuration
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', '**/*.stories.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-children-prop': 'off',
      'no-console': 'off' // Allow console in test files
    }
  }
];

export default config;
