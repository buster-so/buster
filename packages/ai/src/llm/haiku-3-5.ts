import type { LanguageModelV2 } from '@ai-sdk/provider';
import { AI_KEYS, getSecretSync } from '@buster/secrets';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { vertexModel } from './providers/vertex';

// Lazy initialization to allow mocking in tests
let _haiku35Instance: ReturnType<typeof createFallback> | null = null;

function initializeHaiku35() {
  if (_haiku35Instance) {
    return _haiku35Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Only include Anthropic if API key is available
  try {
    getSecretSync(AI_KEYS.ANTHROPIC_API_KEY);
    try {
      models.push(anthropicModel('claude-3-5-haiku-20241022'));
      console.info('Haiku35: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Haiku35: Failed to initialize Anthropic model:', error);
    }
  } catch {
    // API key not available, skip Anthropic model
  }

  // Only include Vertex if credentials are available
  try {
    getSecretSync(AI_KEYS.VERTEX_CLIENT_EMAIL);
    getSecretSync(AI_KEYS.VERTEX_PRIVATE_KEY);
    try {
      models.push(vertexModel('claude-3-5-haiku@20241022'));
      console.info('Haiku35: Vertex AI model added to fallback chain');
    } catch (error) {
      console.warn('Haiku35: Failed to initialize Vertex AI model:', error);
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

  console.info(`Haiku35: Initialized with ${models.length} model(s) in fallback chain`);

  _haiku35Instance = createFallback({
    models,
    modelResetInterval: 60000,
    retryAfterOutput: true,
    onError: (err) => console.error(`FALLBACK.  Here is the error: ${err}`),
  });

  return _haiku35Instance;
}

// Export a proxy that initializes on first use
export const Haiku35 = new Proxy({} as ReturnType<typeof createFallback>, {
  get(_target, prop) {
    const instance = initializeHaiku35();
    // Direct property access without receiver to avoid proxy conflicts
    return instance[prop as keyof typeof instance];
  },
  has(_target, prop) {
    const instance = initializeHaiku35();
    return prop in instance;
  },
  ownKeys(_target) {
    const instance = initializeHaiku35();
    return Reflect.ownKeys(instance);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = initializeHaiku35();
    return Reflect.getOwnPropertyDescriptor(instance, prop);
  },
});
