/**
 * Secret keys used by the @buster/electric package
 */

export const ELECTRIC_KEYS = {
  ELECTRIC_PROXY_URL: 'ELECTRIC_PROXY_URL',
  ELECTRIC_SECRET: 'ELECTRIC_SECRET',
  ELECTRIC_SOURCE_ID: 'ELECTRIC_SOURCE_ID',
} as const;

export type ElectricKeys = (typeof ELECTRIC_KEYS)[keyof typeof ELECTRIC_KEYS];
