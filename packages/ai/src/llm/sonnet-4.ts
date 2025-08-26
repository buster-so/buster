import type { LanguageModelV2 } from '@ai-sdk/provider';
import { AI_KEYS, getSecret } from '@buster/secrets';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { openaiModel } from './providers/openai';
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
    console.info('Sonnet4: No ANTHROPIC_API_KEY found, skipping Anthropic model');
  }

  // Only include Vertex if credentials are available
  try {
    await getSecret(AI_KEYS.VERTEX_CLIENT_EMAIL);
    await getSecret(AI_KEYS.VERTEX_PRIVATE_KEY);
    await getSecret(AI_KEYS.VERTEX_PROJECT);
    try {
      models.push(await vertexModel('claude-sonnet-4@20250514'));
      console.info('Sonnet4: Vertex AI model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Vertex AI model:', error);
    }
  } catch {
    // Vertex credentials not available, skip Vertex model
  }

  // Only include OpenAI if API key is available
  try {
    await getSecret(AI_KEYS.OPENAI_API_KEY);
    try {
      models.push(await openaiModel('gpt-5'));
      console.info('Sonnet4: OpenAI model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize OpenAI model:', error);
    }
  } catch {
    // OpenAI API key not available, skip OpenAI model
  }

  // Add Opus as fallback if Anthropic API key is available
  try {
    await getSecret(AI_KEYS.ANTHROPIC_API_KEY);
    try {
      models.push(await anthropicModel('claude-opus-4-1-20250805'));
      console.info('Opus41: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Opus41: Failed to initialize Anthropic model:', error);
    }
  } catch {
    // Already logged above if Anthropic key not available
  }

  // Ensure we have at least one model
  if (models.length === 0) {
    throw new Error(
      'No AI models available. Please set either Vertex AI (VERTEX_CLIENT_EMAIL, VERTEX_PRIVATE_KEY, and VERTEX_PROJECT), Anthropic (ANTHROPIC_API_KEY), or OpenAI (OPENAI_API_KEY) credentials.'
    );
  }

  console.info(`Sonnet4: Initialized with ${models.length} model(s) in fallback chain`);

  _sonnet4Instance = createFallback({
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

  return _sonnet4Instance;
}

// Export initialization function for async usage
export async function getSonnet4(): Promise<ReturnType<typeof createFallback>> {
  return await initializeSonnet4();
}

// Export a promise-based instance for backwards compatibility
// In test environment, export a resolved promise with a mock value to prevent initialization
export const Sonnet4 =
  process.env.NODE_ENV === 'test' || process.env.VITEST
    ? Promise.resolve('mock-sonnet-4')
    : initializeSonnet4();
