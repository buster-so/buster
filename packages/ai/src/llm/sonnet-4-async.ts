import type { LanguageModelV2 } from '@ai-sdk/provider';
import { createFallback } from './ai-fallback';
import { anthropicModelAsync } from './providers/anthropic-async';
import { vertexModelAsync } from './providers/vertex-async';
import { getSecret } from '@buster/secrets';

// Async initialization for Sonnet 4
export async function initializeSonnet4Async(): Promise<ReturnType<typeof createFallback>> {
  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Check for Anthropic API key
  const anthropicApiKey = await getSecret('ANTHROPIC_API_KEY').catch(() => null);
  if (anthropicApiKey) {
    try {
      const model = await anthropicModelAsync('claude-4-sonnet-20250514');
      models.push(model);
      console.info('Sonnet4: Anthropic model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Anthropic model:', error);
    }
  }

  // Check for Vertex credentials
  const [vertexClientEmail, vertexPrivateKey] = await Promise.all([
    getSecret('VERTEX_CLIENT_EMAIL').catch(() => null),
    getSecret('VERTEX_PRIVATE_KEY').catch(() => null),
  ]);

  if (vertexClientEmail && vertexPrivateKey) {
    try {
      const model = await vertexModelAsync('claude-sonnet-4@20250514');
      models.push(model);
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

  return createFallback({
    models,
    modelResetInterval: 60000,
    retryAfterOutput: true,
    onError: (err) => console.error(`FALLBACK.  Here is the error: ${err}`),
  });
}