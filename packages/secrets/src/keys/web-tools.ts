/**
 * Secret keys used by the @buster/web-tools package
 */

export const WEB_TOOLS_KEYS = {
  FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
} as const;

export type WebToolsKeys = (typeof WEB_TOOLS_KEYS)[keyof typeof WEB_TOOLS_KEYS];
