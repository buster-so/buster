import postProcessingWorkflow, {
  type PostProcessingWorkflowOutput,
} from '@buster/ai/workflows/post-processing-workflow';
import { eq, getDb, messages } from '@buster/database';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { initLogger, wrapTraced } from 'braintrust';
import { z } from 'zod';
import {
  buildWorkflowInput,
  fetchConversationHistory,
  fetchMessageWithContext,
  fetchPreviousPostProcessingMessages,
  fetchUserDatasets,
  sendSlackNotification,
} from './helpers';
import {
  DataFetchError,
  MessageNotFoundError,
  TaskInputSchema,
  type TaskOutputSchema,
} from './types';
import type { TaskInput, TaskOutput } from './types';

// Schema for the subset of fields we want to save to the database
const PostProcessingDbDataSchema = z.object({
  summaryMessage: z.string().optional(),
  summaryTitle: z.string().optional(),
  formattedMessage: z.string().nullable().optional(),
  assumptions: z
    .array(
      z.object({
        descriptiveTitle: z.string(),
        classification: z.enum([
          'fieldMapping',
          'tableRelationship',
          'dataQuality',
          'dataFormat',
          'dataAvailability',
          'timePeriodInterpretation',
          'timePeriodGranularity',
          'metricInterpretation',
          'segmentInterpretation',
          'quantityInterpretation',
          'requestScope',
          'metricDefinition',
          'segmentDefinition',
          'businessLogic',
          'policyInterpretation',
          'optimization',
          'aggregation',
          'filtering',
          'sorting',
          'grouping',
          'calculationMethod',
          'dataRelevance',
        ]),
        explanation: z.string(),
        label: z.enum(['timeRelated', 'vagueRequest', 'major', 'minor']),
      })
    )
    .optional(),
  message: z.string().optional(),
  toolCalled: z.string(),
  userName: z.string().nullable().optional(),
});

type PostProcessingDbData = z.infer<typeof PostProcessingDbDataSchema>;

/**
 * Extract only the specific fields we want to save to the database
 */
function extractDbFields(
  workflowOutput: PostProcessingWorkflowOutput,
  userName: string | null
): PostProcessingDbData {
  const extracted = {
    summaryMessage: workflowOutput.summaryMessage,
    summaryTitle: workflowOutput.summaryTitle,
    formattedMessage: workflowOutput.formattedMessage,
    assumptions: workflowOutput.assumptions,
    message: workflowOutput.message,
    toolCalled: workflowOutput.toolCalled || 'unknown', // Provide default if missing
    userName,
  };

  // Validate the extracted data matches our schema
  return PostProcessingDbDataSchema.parse(extracted);
}

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

      // Handle branch results - the result will have one of the branch step IDs as a key
      let validatedOutput: PostProcessingWorkflowOutput;
      const branchResult = workflowResult.result as any; // Type assertion needed for branch results

      if ('format-follow-up-message' in branchResult && branchResult['format-follow-up-message']) {
        validatedOutput = branchResult['format-follow-up-message'] as PostProcessingWorkflowOutput;
      } else if (
        'format-initial-message' in branchResult &&
        branchResult['format-initial-message']
      ) {
        validatedOutput = branchResult['format-initial-message'] as PostProcessingWorkflowOutput;
      } else {
        logger.error('Unexpected workflow result structure', {
          messageId: payload.messageId,
          resultKeys: Object.keys(branchResult),
          result: branchResult,
        });
        throw new Error('Post-processing workflow returned unexpected result structure');
      }

      logger.log('Validated output', {
        messageId: payload.messageId,
        summaryTitle: validatedOutput.summaryTitle,
        summaryMessage: validatedOutput.summaryMessage,
        flagChatMessage: validatedOutput.flagChatMessage,
        flagChatTitle: validatedOutput.flagChatTitle,
        toolCalled: validatedOutput.toolCalled,
        assumptions: validatedOutput.assumptions,
        message: validatedOutput.message,
      });

      // Step 5: Store result in database
      logger.log('Storing post-processing result in database', {
        messageId: payload.messageId,
      });

      const db = getDb();

      const dbData = extractDbFields(validatedOutput, messageContext.userName);
      await db
        .update(messages)
        .set({
          postProcessingMessage: dbData,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(messages.id, payload.messageId));

      // Step 6: Send Slack notification if conditions are met
      logger.log('Checking Slack notification conditions', {
        messageId: payload.messageId,
        organizationId: messageContext.organizationId,
        summaryTitle: dbData.summaryTitle,
        summaryMessage: dbData.summaryMessage,
        formattedMessage: dbData.formattedMessage,
        toolCalled: dbData.toolCalled,
      });

      const slackResult = await sendSlackNotification({
        organizationId: messageContext.organizationId,
        userName: messageContext.userName,
        summaryTitle: dbData.summaryTitle,
        summaryMessage: dbData.summaryMessage,
        formattedMessage: dbData.formattedMessage,
        toolCalled: dbData.toolCalled,
        message: dbData.message,
      });

      if (slackResult.sent) {
        logger.log('Slack notification sent successfully', {
          messageId: payload.messageId,
          organizationId: messageContext.organizationId,
        });
      } else {
        logger.log('Slack notification not sent', {
          messageId: payload.messageId,
          organizationId: messageContext.organizationId,
          reason: slackResult.error,
        });
      }

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
