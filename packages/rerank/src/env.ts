// Validate required environment variables
for (const envVar of Object.values({
  RERANK_API_KEY: 'RERANK_API_KEY',
  RERANK_MODEL: 'RERANK_MODEL',
  RERANK_BASE_URL: 'RERANK_BASE_URL',
} as const)) {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is not set`);
  }
}
