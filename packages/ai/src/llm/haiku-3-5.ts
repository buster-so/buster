import type { LanguageModelV2 } from '@ai-sdk/provider';
import { AI_KEYS, getSecret } from '@buster/secrets';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { vertexModel } from './providers/vertex';

// Lazy initialization to allow mocking in tests
let _haiku35Instance: ReturnType<typeof createFallback> | null = null;

async function initializeHaiku35() {
  if (_haiku35Instance) {
    return _haiku35Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Only include Anthropic if API key is available
  try {
    await getSecret(AI_KEYS.ANTHROPIC_API_KEY);
    try {
      models.push(await anthropicModel('claude-3-5-haiku-20241022'));
      console.info('Haiku35: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Haiku35: Failed to initialize Anthropic model:', error);
    }
  } catch {
    // API key not available, skip Anthropic model
  }

  // Only include Vertex if credentials are available
  try {
    await getSecret(AI_KEYS.VERTEX_CLIENT_EMAIL);
    await getSecret(AI_KEYS.VERTEX_PRIVATE_KEY);
    await getSecret(AI_KEYS.VERTEX_PROJECT);
    try {
      models.push(await vertexModel('claude-3-5-haiku@20241022'));
      console.info('Haiku35: Vertex AI model added to fallback chain');
    } catch (error) {
      console.warn('Haiku35: Failed to initialize Vertex AI model:', error);
    }
  } catch {
    // Vertex credentials not available, skip Vertex model
    console.info('Haiku35: Vertex credentials not available, skipping Vertex model');
  }

  // Ensure we have at least one model
  if (models.length === 0) {
    throw new Error(
      'No AI models available. Please set either Vertex AI (VERTEX_CLIENT_EMAIL and VERTEX_PRIVATE_KEY) or Anthropic (ANTHROPIC_API_KEY) credentials.'
    );
  }

  console.info(`Haiku35: Initialized with ${models.length} model(s) in fallback chain`);

  _haiku35Instance = createFallback({
    models,
    modelResetInterval: 60000,
    retryAfterOutput: true,
    onError: (err, modelId) => {
      // Handle various error formats
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        const errObj = err as Record<string, unknown>;
        if ('message' in errObj) {
          errorMessage = String(errObj.message);
        }
        if ('type' in errObj) {
          errorMessage = `${errObj.type}: ${errObj.message || 'No message'}`;
        }
      } else {
        errorMessage = String(err);
      }

      const errorDetails =
        err instanceof Error && err.stack ? err.stack : JSON.stringify(err, null, 2);
      console.error(`FALLBACK from model ${modelId}. Error: ${errorMessage}`);
      console.error('Error details:', errorDetails);
    },
  });

  return _haiku35Instance;
}

// Export initialization function for async usage
export async function getHaiku35(): Promise<ReturnType<typeof createFallback>> {
  return await initializeHaiku35();
}

// Export a promise-based instance for backwards compatibility
export const Haiku35 = initializeHaiku35();
