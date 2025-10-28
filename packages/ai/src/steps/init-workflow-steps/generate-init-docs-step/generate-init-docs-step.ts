import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { createAnalyticsEngineerAgent } from '../../../agents';
import type { AnalyticsEngineerAgentOptions } from '../../../agents/analytics-engineer-agent/types';
import { DEFAULT_ANALYTICS_ENGINEER_OPTIONS } from '../../../llm/providers/gateway';
import type { ModelQueueItem } from '../build-models-queue-step/types';
import type { GenerateInitDocsStepInput, ModelProcessingResult } from './types';

const BATCH_SIZE = 100;

/**
 * Replace {{model_path}} placeholder with actual model path
 * Pure function - easily unit testable
 */
export function replaceModelPath(promptTemplate: string, modelPath: string): string {
  return promptTemplate.replace(/\{\{model_path\}\}/g, modelPath);
}

/**
 * Process a single model with the analytics engineer agent
 * Returns result object indicating success/failure
 */
export async function processModel(
  model: ModelQueueItem,
  promptTemplate: string,
  agentOptions: Omit<AnalyticsEngineerAgentOptions, 'todosList' | 'isInResearchMode'>
): Promise<ModelProcessingResult> {
  try {
    // Replace model_path placeholder with absolute path
    const prompt = replaceModelPath(promptTemplate, model.absolutePath);

    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: prompt,
        providerOptions: DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
      },
    ];

    const analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions = {
      ...agentOptions,
      todosList: [],
      isInResearchMode: false,
    };

    const analyticsEngineerAgent = createAnalyticsEngineerAgent(analyticsEngineerAgentOptions);

    const stream = await analyticsEngineerAgent.stream({ messages });

    // Consume entire stream
    for await (const _chunk of stream.fullStream) {
      // Just consume, no need to process
    }

    return {
      modelName: model.modelName,
      success: true,
    };
  } catch (error) {
    console.error(`Failed to process model ${model.modelName}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      modelName: model.modelName,
      modelPath: model.absolutePath,
    });
    return {
      modelName: model.modelName,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process models with backfilling concurrent queue
 * Maintains BATCH_SIZE concurrent operations at all times
 * As soon as one completes, the next model starts processing
 */
export async function processConcurrentQueue(
  models: ModelQueueItem[],
  promptTemplate: string,
  agentOptions: Omit<AnalyticsEngineerAgentOptions, 'todosList' | 'isInResearchMode'>,
  concurrency: number = BATCH_SIZE
): Promise<ModelProcessingResult[]> {
  const allResults: ModelProcessingResult[] = [];
  let currentIndex = 0;

  // Map to track active promises with their index
  const activePromises = new Map<
    number,
    Promise<{ index: number; result: ModelProcessingResult }>
  >();

  // Start initial batch
  while (currentIndex < Math.min(concurrency, models.length)) {
    const index = currentIndex;
    const model = models[index];
    if (!model) break;

    const promise = processModel(model, promptTemplate, agentOptions).then((result) => ({
      index,
      result,
    }));

    activePromises.set(index, promise);
    currentIndex++;
  }

  // Process remaining models
  while (activePromises.size > 0) {
    // Wait for any promise to complete
    const completed = await Promise.race(activePromises.values());

    // Store result
    allResults[completed.index] = completed.result;

    // Remove completed promise
    activePromises.delete(completed.index);

    // Start next model if available
    if (currentIndex < models.length) {
      const index = currentIndex;
      const model = models[index];
      if (!model) break;

      console.info(
        `Starting model ${currentIndex + 1}/${models.length}: ${model.modelName} (${activePromises.size + 1} active)`
      );

      const promise = processModel(model, promptTemplate, agentOptions).then((result) => ({
        index,
        result,
      }));

      activePromises.set(index, promise);
      currentIndex++;
    }
  }

  return allResults;
}

/**
 * Generate documentation for all models in queue
 * Uses backfilling concurrent queue for optimal throughput
 */
export async function generateInitDocs(
  input: GenerateInitDocsStepInput
): Promise<ModelProcessingResult[]> {
  // Load prompt template
  let promptTemplate: string;
  try {
    const promptPath = path.join(__dirname, 'generate-init-docs-step-prompt.txt');
    promptTemplate = await readFile(promptPath, 'utf-8');
  } catch (error) {
    console.error('Failed to load prompt template:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      chatId: input.chatId,
      organizationId: input.organizationId,
    });
    throw new Error('Failed to load prompt template', { cause: error });
  }

  console.info(
    `Starting concurrent processing of ${input.models.length} models with concurrency limit of ${BATCH_SIZE}`
  );
  console.info(`Models to process: ${input.models.map((m) => m.modelName).join(', ')}`);

  const agentOptions: Omit<AnalyticsEngineerAgentOptions, 'todosList' | 'isInResearchMode'> = {
    chatId: input.chatId,
    messageId: input.messageId,
    userId: input.userId,
    organizationId: input.organizationId,
    dataSourceId: input.dataSourceId,
  };

  // Process all models with backfilling concurrent queue
  let allResults: ModelProcessingResult[];
  try {
    allResults = await processConcurrentQueue(input.models, promptTemplate, agentOptions);
  } catch (error) {
    console.error('Failed to process concurrent queue:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      modelsCount: input.models.length,
      chatId: input.chatId,
      organizationId: input.organizationId,
    });
    throw new Error('Failed to process concurrent queue', { cause: error });
  }

  // Final summary
  const successCount = allResults.filter((r) => r.success).length;
  const failureCount = allResults.filter((r) => !r.success).length;
  console.info(
    `Processed ${allResults.length} models: ${successCount} succeeded, ${failureCount} failed`
  );

  if (failureCount > 0) {
    const failedModels = allResults.filter((r) => !r.success).map((r) => r.modelName);
    console.warn(`Failed models: ${failedModels.join(', ')}`);
  }

  return allResults;
}

/**
 * Generate Init Docs Step - Process all models for documentation
 * Wrapped with braintrust tracing
 */
export async function generateInitDocsStep(input: GenerateInitDocsStepInput): Promise<void> {
  return wrapTraced(
    async () => {
      try {
        await generateInitDocs(input);
        return;
      } catch (error) {
        console.error('Generate init docs step failed:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          modelsCount: input.models.length,
          chatId: input.chatId,
          organizationId: input.organizationId,
        });
        throw error;
      }
    },
    {
      name: 'Generate Init Docs Step',
    }
  )();
}
