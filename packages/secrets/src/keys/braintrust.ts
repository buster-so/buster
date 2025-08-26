/**
 * Secret keys used by braintrust
 */

export const BRAINTRUST_KEYS = {
  BRAINTRUST_API_KEY: 'BRAINTRUST_API_KEY',
  BRAINTRUST_PROJECT_NAME: 'BRAINTRUST_PROJECT_NAME',
} as const;

export type BraintrustKeys = (typeof BRAINTRUST_KEYS)[keyof typeof BRAINTRUST_KEYS];
