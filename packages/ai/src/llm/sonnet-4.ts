import type { LanguageModelV2 } from '@ai-sdk/provider';
import { AI_KEYS, getSecret } from '@buster/secrets';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { vertexModel } from './providers/vertex';

// Lazy initialization to allow mocking in tests
let _sonnet4Instance: ReturnType<typeof createFallback> | null = null;

async function initializeSonnet4() {
  if (_sonnet4Instance) {
    return _sonnet4Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Only include Anthropic if API key is available
  try {
    await getSecret(AI_KEYS.ANTHROPIC_API_KEY);
    try {
      models.push(await anthropicModel('claude-4-sonnet-20250514'));
      console.info('Sonnet4: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Anthropic model:', error);
    }
  } catch {
    // API key not available, skip Anthropic model
  }

  // Only include Vertex if credentials are available
  try {
    await getSecret(AI_KEYS.VERTEX_CLIENT_EMAIL);
    await getSecret(AI_KEYS.VERTEX_PRIVATE_KEY);
    try {
      models.push(await vertexModel('claude-sonnet-4@20250514'));
      console.info('Sonnet4: Vertex AI model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Vertex AI model:', error);
    }
  } catch {
    // Vertex credentials not available, skip Vertex model
  }

  // Ensure we have at least one model
  if (models.length === 0) {
    throw new Error(
      'No AI models available. Please set either Vertex AI (VERTEX_CLIENT_EMAIL and VERTEX_PRIVATE_KEY) or Anthropic (ANTHROPIC_API_KEY) credentials.'
    );
  }

  console.info(`Sonnet4: Initialized with ${models.length} model(s) in fallback chain`);

  _sonnet4Instance = createFallback({
    models,
    modelResetInterval: 60000,
    retryAfterOutput: true,
    onError: (err) => console.error(`FALLBACK.  Here is the error: ${err}`),
  });

  return _sonnet4Instance;
}

// Export initialization function for async usage
export async function getSonnet4(): Promise<ReturnType<typeof createFallback>> {
  return await initializeSonnet4();
}

// Export a promise-based instance for backwards compatibility
export const Sonnet4 = initializeSonnet4();
