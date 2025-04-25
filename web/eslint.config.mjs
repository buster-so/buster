import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'plugin:storybook/recommended'],
    env: {
      node: true,
      jest: true
    },
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-unused-vars': 'off',
      'no-empty-pattern': 'off',
      'no-undef': 'error',
      'react/no-children-prop': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'prefer-const': [
        'error',
        {
          destructuring: 'all'
        }
      ]
    }
  })
];

export default eslintConfig;
