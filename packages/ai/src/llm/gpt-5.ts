import type { LanguageModelV2 } from '@ai-sdk/provider';
import { AI_KEYS, getSecret } from '@buster/secrets';
import { createFallback } from './ai-fallback';
import { openaiModel } from './providers/openai';

// Lazy initialization to allow mocking in tests
let _gpt5Instance: ReturnType<typeof createFallback> | null = null;

async function initializeGPT5() {
  if (_gpt5Instance) {
    return _gpt5Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Only include OpenAI if API key is available
  try {
    await getSecret(AI_KEYS.OPENAI_API_KEY);
    try {
      models.push(await openaiModel('gpt-5-2025-08-07'));
      console.info('GPT5: OpenAI model added to fallback chain');
    } catch (error) {
      console.warn('GPT5: Failed to initialize OpenAI model:', error);
    }
  } catch {
    // API key not available, skip OpenAI model
  }

  // Ensure we have at least one model
  if (models.length === 0) {
    throw new Error('No AI models available. Please set OPENAI_API_KEY environment variable.');
  }

  console.info(`GPT5: Initialized with ${models.length} model(s) in fallback chain`);

  _gpt5Instance = createFallback({
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

  return _gpt5Instance;
}

// Export initialization function for async usage
export async function getGPT5(): Promise<ReturnType<typeof createFallback>> {
  return await initializeGPT5();
}

// Export a promise-based instance for backwards compatibility
export const GPT5 = initializeGPT5();
