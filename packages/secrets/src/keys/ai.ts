/**
 * Secret keys used by the @buster/ai package
 */

export const AI_KEYS = {
  // LLM Provider Keys
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',

  // Vertex AI Keys
  VERTEX_CLIENT_EMAIL: 'VERTEX_CLIENT_EMAIL',
  VERTEX_PRIVATE_KEY: 'VERTEX_PRIVATE_KEY',
  VERTEX_PROJECT: 'VERTEX_PROJECT',

  // Evaluation & Testing
  BRAINTRUST_KEY: 'BRAINTRUST_KEY',

  // External Services
  FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
  DAYTONA_API_KEY: 'DAYTONA_API_KEY',

  // Environment
  ENVIRONMENT: 'ENVIRONMENT',
  DATABASE_URL: 'DATABASE_URL',

  // System paths (these might not need to be in Infiscal)
  PATH: 'PATH',
  HOME: 'HOME',
} as const;

export type AIKeys = (typeof AI_KEYS)[keyof typeof AI_KEYS];
