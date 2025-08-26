import type { LanguageModelV2 } from '@ai-sdk/provider';
import { AI_KEYS, getSecret } from '@buster/secrets';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { vertexModel } from './providers/vertex';

// Lazy initialization to allow mocking in tests
let _opus41Instance: ReturnType<typeof createFallback> | null = null;

async function initializeOpus41() {
  if (_opus41Instance) {
    return _opus41Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Only include Anthropic if API key is available
  try {
    await getSecret(AI_KEYS.ANTHROPIC_API_KEY);
    try {
      models.push(await anthropicModel('claude-opus-4-1-20250805'));
      console.info('Opus41: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Opus41: Failed to initialize Anthropic model:', error);
    }
  } catch {
    // API key not available, skip Anthropic model
  }

  // Ensure we have at least one model
  if (models.length === 0) {
    throw new Error(
      'No AI models available. Please set either Vertex AI (VERTEX_CLIENT_EMAIL and VERTEX_PRIVATE_KEY) or Anthropic (ANTHROPIC_API_KEY) credentials.'
    );
  }

  console.info(`Opus41: Initialized with ${models.length} model(s) in fallback chain`);

  _opus41Instance = createFallback({
    models,
    modelResetInterval: 60000,
    retryAfterOutput: true,
    onError: (err) => console.error(`FALLBACK.  Here is the error: ${err}`),
  });

  return _opus41Instance;
}

// Export initialization function for async usage
export async function getOpus41(): Promise<ReturnType<typeof createFallback>> {
  return await initializeOpus41();
}

// Export a promise-based instance for backwards compatibility
export const Opus41 = initializeOpus41();
