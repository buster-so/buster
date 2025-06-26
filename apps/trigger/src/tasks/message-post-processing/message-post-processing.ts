import postProcessingWorkflow from '@buster/ai/workflows/post-processing-workflow';
import { eq, getDb, messages } from '@buster/database';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { initLogger, wrapTraced } from 'braintrust';
import {
  buildWorkflowInput,
  fetchConversationHistory,
  fetchMessageWithContext,
  fetchPreviousPostProcessingMessages,
  fetchUserDatasets,
} from './helpers';
import {
  DataFetchError,
  MessageNotFoundError,
  TaskInputSchema,
  type TaskOutputSchema,
} from './types';
import type { TaskInput, TaskOutput } from './types';

/**
 * Message Post-Processing Task
 *
 * Processes messages after creation to extract insights, assumptions,
 * and generate follow-up suggestions using AI workflows.
 */
export const messagePostProcessingTask: ReturnType<
  typeof schemaTask<'message-post-processing', typeof TaskInputSchema, TaskOutput>
> = schemaTask<'message-post-processing', typeof TaskInputSchema, TaskOutput>({
  id: 'message-post-processing',
  schema: TaskInputSchema,
  maxDuration: 300, // 300 seconds timeout
  run: async (payload: TaskInput): Promise<TaskOutput> => {
    const startTime = Date.now();

    if (!process.env.BRAINTRUST_KEY) {
      throw new Error('BRAINTRUST_KEY is not set');
    }

    // Initialize Braintrust logging for observability
    initLogger({
      apiKey: process.env.BRAINTRUST_KEY,
      projectName: process.env.ENVIRONMENT || 'development',
    });

    try {
      logger.log('Starting message post-processing task', {
        messageId: payload.messageId,
      });

      // Step 1: Fetch message context (this will throw if message not found)
      const messageContext = await fetchMessageWithContext(payload.messageId);
      logger.log('Fetched message context', {
        chatId: messageContext.chatId,
        userId: messageContext.createdBy,
        organizationId: messageContext.organizationId,
      });

      // Step 2: Fetch all required data concurrently
      const [conversationMessages, previousPostProcessingResults, datasets] = await Promise.all([
        fetchConversationHistory(messageContext.chatId),
        fetchPreviousPostProcessingMessages(messageContext.chatId, messageContext.createdAt),
        fetchUserDatasets(messageContext.createdBy),
      ]);

      logger.log('Fetched required data', {
        messageId: payload.messageId,
        conversationMessagesCount: conversationMessages.length,
        previousPostProcessingCount: previousPostProcessingResults.length,
        datasetsCount: datasets.length,
      });

      // Step 3: Build workflow input
      const workflowInput = buildWorkflowInput(
        messageContext,
        conversationMessages,
        previousPostProcessingResults,
        datasets
      );

      logger.log('Built workflow input', {
        messageId: payload.messageId,
        isFollowUp: workflowInput.isFollowUp,
        previousMessagesCount: workflowInput.previousMessages.length,
        hasConversationHistory: !!workflowInput.conversationHistory,
        datasetsLength: workflowInput.datasets.length,
      });

      // Step 4: Execute post-processing workflow
      logger.log('Starting post-processing workflow execution', {
        messageId: payload.messageId,
      });

      const tracedWorkflow = wrapTraced(
        async () => {
          const run = postProcessingWorkflow.createRun();
          return await run.start({
            inputData: workflowInput,
          });
        },
        {
          name: 'Message Post-Processing Workflow',
        }
      );

      const workflowResult = await tracedWorkflow();

      if (!workflowResult || workflowResult.status !== 'success' || !workflowResult.result) {
        throw new Error('Post-processing workflow returned no output');
      }

      const validatedOutput = workflowResult.result;

      // Step 5: Store result in database
      logger.log('Storing post-processing result in database', {
        messageId: payload.messageId,
      });

      const db = getDb();
      await db
        .update(messages)
        .set({
          postProcessingMessage: validatedOutput,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(messages.id, payload.messageId));

      logger.log('Message post-processing completed successfully', {
        messageId: payload.messageId,
        executionTimeMs: Date.now() - startTime,
      });

      // Wait 500ms to allow Braintrust to clean up its trace before completing
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        messageId: payload.messageId,
        result: {
          success: true,
          messageId: payload.messageId,
          executionTimeMs: Date.now() - startTime,
          workflowCompleted: true,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Post-processing task execution failed', {
        messageId: payload.messageId,
        error: errorMessage,
        executionTimeMs: Date.now() - startTime,
      });

      return {
        success: false,
        messageId: payload.messageId,
        error: {
          code: getErrorCode(error),
          message: errorMessage,
          details: {
            operation: 'message_post_processing_task_execution',
            messageId: payload.messageId,
          },
        },
      };
    }
  },
});

/**
 * Get error code from error object for consistent error handling
 */
function getErrorCode(error: unknown): string {
  if (error instanceof MessageNotFoundError) {
    return 'MESSAGE_NOT_FOUND';
  }

  if (error instanceof DataFetchError) {
    return 'DATA_FETCH_ERROR';
  }

  if (error instanceof Error) {
    // Validation errors
    if (error.name === 'ZodError' || error.name === 'ValidationError') {
      return 'VALIDATION_ERROR';
    }

    // Workflow errors
    if (error.message.includes('workflow')) {
      return 'WORKFLOW_EXECUTION_ERROR';
    }

    // Database errors
    if (error.message.includes('database') || error.message.includes('Database')) {
      return 'DATABASE_ERROR';
    }

    // Permission errors
    if (error.message.includes('permission') || error.message.includes('access')) {
      return 'ACCESS_DENIED';
    }
  }

  return 'UNKNOWN_ERROR';
}

export type MessagePostProcessingTask = typeof messagePostProcessingTask;
