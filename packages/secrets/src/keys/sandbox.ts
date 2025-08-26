/**
 * Secret keys used by the @buster/sandbox package
 */

export const SANDBOX_KEYS = {
  DAYTONA_API_KEY: 'DAYTONA_API_KEY',
} as const;

export type SandboxKeys = (typeof SANDBOX_KEYS)[keyof typeof SANDBOX_KEYS];
