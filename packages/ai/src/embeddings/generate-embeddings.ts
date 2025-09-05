/**
 * Functional embedding generation for searchable values
 * Uses openai/text-embedding-3-small model via AI Gateway
 */

import { createGateway } from '@ai-sdk/gateway';
import type { EmbeddingModel } from 'ai';
import { embedMany } from 'ai';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GenerateEmbeddingsInputSchema = z.object({
  values: z.array(z.string().min(1)),
  model: z.string().default('text-embedding-3-small'),
});

const GenerateEmbeddingsOutputSchema = z.object({
  embeddings: z.array(z.array(z.number())),
  successCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  errors: z.array(
    z.object({
      index: z.number().int(),
      value: z.string(),
      error: z.string(),
    })
  ),
});

const RetryOptionsSchema = z.object({
  maxRetries: z.number().int().min(0).default(3),
  initialDelayMs: z.number().int().min(0).default(1000),
  maxDelayMs: z.number().int().min(0).default(10000),
});

// ============================================================================
// TYPES
// ============================================================================

export type GenerateEmbeddingsInput = z.infer<typeof GenerateEmbeddingsInputSchema>;
export type GenerateEmbeddingsOutput = z.infer<typeof GenerateEmbeddingsOutputSchema>;
export type RetryOptions = z.infer<typeof RetryOptionsSchema>;

// ============================================================================
// CONFIGURATION
// ============================================================================

export const EMBEDDING_CONFIG = {
  BATCH_SIZE: 100,
  MAX_RETRIES: 3,
  RATE_LIMIT_DELAY: 1000,
  MODEL: 'openai/text-embedding-3-small',
} as const;

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Split array into batches of specified size
 */
export const batchArray = <T>(array: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number => {
  const delay = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay;
  return Math.round(delay + jitter);
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('temporarily')
    );
  }
  return false;
};

// ============================================================================
// EMBEDDING GENERATION FUNCTIONS
// ============================================================================

/**
 * Get embedding model via gateway
 */
const getEmbeddingModel = (modelName: string = EMBEDDING_CONFIG.MODEL): EmbeddingModel<string> => {
  const gateway = createGateway({
    ...(process.env.AI_GATEWAY_API_KEY && { apiKey: process.env.AI_GATEWAY_API_KEY }),
  });
  // Use the textEmbeddingModel method to create an embedding model

  return gateway.textEmbeddingModel(modelName);
};

/**
 * Generate embeddings for a batch of values with retry logic
 */
const generateBatchEmbeddingsWithRetry = async (
  batch: string[],
  model: string,
  retryOptions: RetryOptions
): Promise<{
  embeddings: number[][];
  errors: Array<{ index: number; value: string; error: string }>;
}> => {
  const validatedOptions = RetryOptionsSchema.parse(retryOptions);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < validatedOptions.maxRetries; attempt++) {
    try {
      // Use AI SDK's embedMany function with embedding model
      const { embeddings } = await embedMany({
        model: getEmbeddingModel(model),
        values: batch,
      });

      // Convert embeddings and log dimensions for debugging
      const embeddingArrays = embeddings.map((e) => Array.from(e));

      // Log the actual dimensions received
      if (embeddingArrays.length > 0 && embeddingArrays[0]) {
        console.info(
          `[Embeddings] Generated embeddings with dimensions: ${embeddingArrays[0].length}`
        );
      }

      return {
        embeddings: embeddingArrays,
        errors: [],
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error) || attempt === validatedOptions.maxRetries - 1) {
        // Return errors for each value in the batch
        return {
          embeddings: [],
          errors: batch.map((value, index) => ({
            index,
            value,
            error: lastError?.message || 'Unknown error',
          })),
        };
      }

      // Calculate backoff delay and wait
      const delay = calculateBackoffDelay(
        attempt,
        validatedOptions.initialDelayMs,
        validatedOptions.maxDelayMs
      );
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs this
  return {
    embeddings: [],
    errors: batch.map((value, index) => ({
      index,
      value,
      error: lastError?.message || 'Unknown error',
    })),
  };
};

/**
 * Generate embeddings for searchable values
 * Handles batching, rate limiting, and retries
 */
export const generateSearchableValueEmbeddings = async (values: string[]): Promise<number[][]> => {
  const validated = GenerateEmbeddingsInputSchema.parse({
    values,
    model: EMBEDDING_CONFIG.MODEL,
  });

  const batches = batchArray(validated.values, EMBEDDING_CONFIG.BATCH_SIZE);
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) continue; // Skip if batch is undefined

    // Add rate limiting delay between batches (except for the first)
    if (i > 0) {
      await sleep(EMBEDDING_CONFIG.RATE_LIMIT_DELAY);
    }

    const { embeddings, errors } = await generateBatchEmbeddingsWithRetry(batch, validated.model, {
      maxRetries: EMBEDDING_CONFIG.MAX_RETRIES,
      initialDelayMs: EMBEDDING_CONFIG.RATE_LIMIT_DELAY,
      maxDelayMs: 10000,
    });

    if (errors.length > 0) {
      // For simplicity, throw on any errors
      // In production, you might want to handle partial failures differently
      throw new Error(
        `Failed to generate embeddings for ${errors.length} values: ${errors[0]?.error || 'Unknown error'}`
      );
    }

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
};

/**
 * Generate embedding for a single value
 * Convenience function that wraps batch generation
 */
export const generateSingleValueEmbedding = async (value: string): Promise<number[]> => {
  const embeddings = await generateSearchableValueEmbeddings([value]);
  return embeddings[0] || [];
};

/**
 * Generate embeddings with detailed results
 * Returns both successful embeddings and any errors
 */
export const generateEmbeddingsWithDetails = async (
  input: GenerateEmbeddingsInput
): Promise<GenerateEmbeddingsOutput> => {
  const validated = GenerateEmbeddingsInputSchema.parse(input);
  const batches = batchArray(validated.values, EMBEDDING_CONFIG.BATCH_SIZE);

  const allEmbeddings: number[][] = [];
  const allErrors: Array<{ index: number; value: string; error: string }> = [];
  let successCount = 0;
  let currentIndex = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    if (!batch) continue; // Skip if batch is undefined

    // Add rate limiting delay
    if (i > 0) {
      await sleep(EMBEDDING_CONFIG.RATE_LIMIT_DELAY);
    }

    const { embeddings, errors } = await generateBatchEmbeddingsWithRetry(batch, validated.model, {
      maxRetries: EMBEDDING_CONFIG.MAX_RETRIES,
      initialDelayMs: EMBEDDING_CONFIG.RATE_LIMIT_DELAY,
      maxDelayMs: 10000,
    });

    // Handle successful embeddings
    if (embeddings.length > 0) {
      allEmbeddings.push(...embeddings);
      successCount += embeddings.length;
    }

    // Adjust error indices to be relative to the full input array
    if (errors.length > 0) {
      const adjustedErrors = errors.map((e) => ({
        ...e,
        index: currentIndex + e.index,
      }));
      allErrors.push(...adjustedErrors);

      // For failed batches, add placeholder empty embeddings
      for (let j = 0; j < batch.length; j++) {
        allEmbeddings.push([]);
      }
    }

    currentIndex += batch.length;
  }

  return GenerateEmbeddingsOutputSchema.parse({
    embeddings: allEmbeddings,
    successCount,
    failedCount: allErrors.length,
    errors: allErrors,
  });
};

/**
 * Validate that embeddings have correct dimensions
 */
export const validateEmbeddingDimensions = (
  embeddings: number[][],
  expectedDimensions?: number
): boolean => {
  if (!expectedDimensions) {
    // If no expected dimensions, just check they all have the same dimensions
    if (embeddings.length === 0) return true;
    const firstLength = embeddings[0]?.length ?? 0;
    return embeddings.every((embedding) => embedding.length === firstLength);
  }
  return embeddings.every((embedding) => embedding.length === expectedDimensions);
};

/**
 * Calculate similarity between two embeddings using cosine similarity
 */
export const cosineSimilarity = (embedding1: number[], embedding2: number[]): number => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    const val1 = embedding1[i];
    const val2 = embedding2[i];
    if (val1 !== undefined && val2 !== undefined) {
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    }
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};
