import { currentSpan, wrapTraced } from 'braintrust';
import { buildModelsQueueStep } from '../../steps/init-workflow-steps/build-models-queue-step/build-models-queue-step';
import { createAgentsMdStep } from '../../steps/init-workflow-steps/create-agents-md-step/create-agents-md-step';
import { findDbtModelPathsStep } from '../../steps/init-workflow-steps/find-dbt-model-paths-step/find-dbt-model-paths-step';
import { generateInitDocsStep } from '../../steps/init-workflow-steps/generate-init-docs-step/generate-init-docs-step';
import type { InitWorkflowInput, InitWorkflowOutput } from './types';

/**
 * Runs the init workflow
 * This workflow initializes and processes the initial setup
 */
export async function runInitWorkflow(input: InitWorkflowInput): Promise<void> {
  return wrapTraced(
    async () => {
      try {
        currentSpan().log({
          metadata: {
            chatId: input.chatId,
            messageId: input.messageId,
            userId: input.userId,
            organizationId: input.organizationId,
          },
        });

        await initWorkflow(input);

        return;
      } catch (error) {
        console.error('Init workflow failed:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          chatId: input.chatId,
          messageId: input.messageId,
          userId: input.userId,
          organizationId: input.organizationId,
        });
        throw error;
      }
    },
    {
      name: 'Init Workflow',
    }
  )();
}

export async function initWorkflow(input: InitWorkflowInput): Promise<void> {
  try {
    await createAgentsMdStep(input);
  } catch (error) {
    console.error('Failed to create agents.md file:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      chatId: input.chatId,
      organizationId: input.organizationId,
    });
    throw new Error('Create agents.md step failed', { cause: error });
  }

  let dbtModelPaths: string[];
  try {
    dbtModelPaths = await findDbtModelPathsStep();
  } catch (error) {
    console.error('Failed to find dbt model paths:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      chatId: input.chatId,
      organizationId: input.organizationId,
    });
    throw new Error('Find dbt model paths step failed', { cause: error });
  }

  let modelsQueue: Awaited<ReturnType<typeof buildModelsQueueStep>>;
  try {
    modelsQueue = await buildModelsQueueStep(dbtModelPaths);
  } catch (error) {
    console.error('Failed to build models queue:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      dbtModelPathsCount: dbtModelPaths.length,
      chatId: input.chatId,
      organizationId: input.organizationId,
    });
    throw new Error('Build models queue step failed', { cause: error });
  }

  currentSpan().log({
    metadata: {
      totalModelsInQueue: modelsQueue.length,
    },
  });

  try {
    await generateInitDocsStep({
      models: modelsQueue,
      chatId: input.chatId,
      messageId: input.messageId,
      userId: input.userId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
    });
  } catch (error) {
    console.error('Failed to generate init docs:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      modelsQueueLength: modelsQueue.length,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
    });
    throw new Error('Generate init docs step failed', { cause: error });
  }

  return;
}
