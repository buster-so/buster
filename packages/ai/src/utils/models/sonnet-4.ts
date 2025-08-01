import type { LanguageModelV1 } from '@ai-sdk/provider';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { vertexModel } from './providers/vertex';

// Lazy initialization to allow mocking in tests
let _sonnet4Instance: ReturnType<typeof createFallback> | null = null;

function initializeSonnet4() {
  if (_sonnet4Instance) {
    return _sonnet4Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV1[] = [];

  // Only include Anthropic if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      models.push(anthropicModel('claude-4-sonnet-20250514'));
      console.info('Sonnet4: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Anthropic model:', error);
    }
  }

  // Only include Vertex if credentials are available
  if (process.env.VERTEX_CLIENT_EMAIL && process.env.VERTEX_PRIVATE_KEY) {
    try {
      models.push(vertexModel('claude-sonnet-4@20250514'));
      console.info('Sonnet4: Vertex AI model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Vertex AI model:', error);
    }
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

// Export a proxy that initializes on first use
export const Sonnet4 = new Proxy({} as ReturnType<typeof createFallback>, {
  get(_target, prop) {
    const instance = initializeSonnet4();
    // Use Reflect.get to properly handle getters and preserve 'this' context
    const value = Reflect.get(instance, prop, instance);
    // If it's a function, bind it to the instance to preserve 'this'
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  has(_target, prop) {
    const instance = initializeSonnet4();
    return prop in instance;
  },
  ownKeys(_target) {
    const instance = initializeSonnet4();
    return Reflect.ownKeys(instance);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = initializeSonnet4();
    return Reflect.getOwnPropertyDescriptor(instance, prop);
  },
});
