import postProcessingWorkflow, {
  type PostProcessingWorkflowOutput,
} from '@buster/ai/workflows/message-post-processing-workflow/message-post-processing-workflow';
import {
  dbInitialized,
  eq,
  getBraintrustMetadata,
  messages,
  slackIntegrations,
} from '@buster/database';
import type {
  AssumptionClassification,
  AssumptionLabel,
  ConfidenceScore,
  PostProcessingMessage,
} from '@buster/server-shared/message';
import { logger, schemaTask } from '@trigger.dev/sdk/v3';
import { currentSpan, initLogger, wrapTraced } from 'braintrust';
import { z } from 'zod/v4';
import {
  buildWorkflowInput,
  fetchMessageWithContext,
  fetchPreviousPostProcessingMessages,
  fetchUserDatasets,
  getExistingSlackMessageForChat,
  sendSlackNotification,
  sendSlackReplyNotification,
  trackSlackNotification,
} from './helpers';
import { DataFetchError, MessageNotFoundError, TaskInputSchema } from './types';
import type { TaskInput, TaskOutput } from './types';

/**
 * Extract only the specific fields we want to save to the database
 */
function extractDbFields(
  workflowOutput: PostProcessingWorkflowOutput,
  userName: string
): PostProcessingMessage {
  logger.log('Extracting database fields from workflow output', {
    workflowOutput,
  });

  // Check if there are any major assumptions
  const hasMajorAssumptions =
    workflowOutput.assumptionsResult?.assumptions?.some(
      (assumption) => assumption.label === 'major'
    ) ?? false;

  // Determine confidence score based on rules:
  // - Low if toolCalled is 'flagChat'
  // - Low if there are any major assumptions
  // - High otherwise
  let confidence_score: ConfidenceScore = 'high';
  if (workflowOutput.assumptionsResult?.toolCalled === 'flagChat' || hasMajorAssumptions) {
    confidence_score = 'low';
  }

  // Determine summary message and title
  let summaryMessage: string;
  let summaryTitle: string;

  if (!hasMajorAssumptions && workflowOutput.flagChatResult?.message) {
    // If no major assumptions, use flagChatMessage as summaryMessage
    summaryMessage = workflowOutput.flagChatResult.message;
    summaryTitle = 'No Major Assumptions Identified';
  } else {
    // Otherwise use the provided summary fields or defaults
    summaryMessage =
      workflowOutput.flagChatResult?.summaryMessage ||
      workflowOutput.formattedMessage ||
      'No summary available';
    summaryTitle = workflowOutput.flagChatResult?.summaryTitle || 'Summary';
  }

  const extracted: PostProcessingMessage = {
    summary_message: summaryMessage,
    summary_title: summaryTitle,
    confidence_score,
    assumptions: workflowOutput.assumptionsResult?.assumptions?.map((assumption) => ({
      descriptive_title: assumption.descriptiveTitle,
      classification: assumption.classification as AssumptionClassification,
      explanation: assumption.explanation,
      label: assumption.label as AssumptionLabel,
    })),
    tool_called: workflowOutput.assumptionsResult?.toolCalled || 'unknown', // Provide default if missing
    user_name: userName,
  };

  // Validate the extracted data matches our schema
  return extracted;
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

    // Initialize Braintrust logger
    const braintrustLogger = initLogger({
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
      const [previousPostProcessingResults, datasets, braintrustMetadata, existingSlackMessage] =
        await Promise.all([
          fetchPreviousPostProcessingMessages(messageContext.chatId, messageContext.createdAt),
          fetchUserDatasets(messageContext.createdBy),
          getBraintrustMetadata({ messageId: payload.messageId }),
          getExistingSlackMessageForChat(messageContext.chatId),
        ]);

      logger.log('Fetched required data', {
        messageId: payload.messageId,
        previousPostProcessingCount: previousPostProcessingResults.length,
        datasetsCount: datasets.datasets.length,
        braintrustMetadata, // Log the metadata to verify it's working
        slackMessageExists: existingSlackMessage?.exists || false,
        hasRawLlmMessages: !!messageContext.rawLlmMessages,
      });

      // Step 3: Build workflow input
      const workflowInput = buildWorkflowInput(
        messageContext,
        previousPostProcessingResults,
        datasets.datasets,
        existingSlackMessage?.exists || false
      );

      logger.log('Built workflow input', {
        messageId: payload.messageId,
        isFollowUp: workflowInput.isFollowUp,
        isSlackFollowUp: workflowInput.isSlackFollowUp,
        previousMessagesCount: previousPostProcessingResults.length,
        hasConversationHistory: !!workflowInput.conversationHistory,
        datasetsLength: workflowInput.datasets.length,
      });

      // Step 4: Execute post-processing workflow
      logger.log('Starting post-processing workflow execution', {
        messageId: payload.messageId,
      });

      const tracedWorkflow = wrapTraced(
        async () => {
          currentSpan().log({
            metadata: {
              userName: braintrustMetadata.userName || 'Unknown',
              userId: braintrustMetadata.userId,
              organizationName: braintrustMetadata.organizationName || 'Unknown',
              organizationId: braintrustMetadata.organizationId,
              messageId: braintrustMetadata.messageId,
              chatId: braintrustMetadata.chatId,
            },
          });

          return await postProcessingWorkflow(workflowInput);
        },
        {
          name: 'Message Post-Processing Workflow',
        }
      );

      const validatedOutput = await tracedWorkflow();

      if (!validatedOutput) {
        throw new Error('Post-processing workflow returned no output');
      }

      logger.log('Validated output', {
        messageId: payload.messageId,
        flagChatResult: validatedOutput.flagChatResult,
        assumptionsResult: validatedOutput.assumptionsResult,
        formattedMessage: validatedOutput.formattedMessage,
      });

      // Step 6: Store result in database
      logger.log('Storing post-processing result in database', {
        messageId: payload.messageId,
      });

      const dbData = extractDbFields(validatedOutput, messageContext.userName);

      try {
        const db = await dbInitialized;
        await db
          .update(messages)
          .set({
            postProcessingMessage: dbData,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(messages.id, payload.messageId));

        logger.log('Database update successful', {
          messageId: payload.messageId,
        });
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        logger.error('Failed to update database with post-processing result', {
          messageId: payload.messageId,
          error: errorMessage,
        });
        console.error('Failed to update database with post-processing result:', {
          messageId: payload.messageId,
          error: errorMessage,
          stack: dbError instanceof Error ? dbError.stack : undefined,
        });
        // Throw the error to ensure the task fails when database update fails
        throw new Error(`Database update failed: ${errorMessage}`);
      }

      // Step 7: Send Slack notification if conditions are met
      let slackNotificationSent = false;

      // Skip Slack notification if tool_called is "noIssuesFound" and there are no major assumptions
      const hasMajorAssumptions =
        dbData.assumptions?.some((assumption) => assumption.label === 'major') ?? false;
      const shouldSkipSlackNotification =
        dbData.tool_called === 'noIssuesFound' && !hasMajorAssumptions;

      try {
        logger.log('Checking Slack notification conditions', {
          messageId: payload.messageId,
          organizationId: messageContext.organizationId,
          summaryTitle: dbData.summary_title,
          summaryMessage: dbData.summary_message,
          toolCalled: dbData.tool_called,
          hasMajorAssumptions,
          shouldSkipSlackNotification,
        });

        if (shouldSkipSlackNotification) {
          logger.log('Skipping Slack notification: noIssuesFound with no major assumptions', {
            messageId: payload.messageId,
            organizationId: messageContext.organizationId,
          });
        } else {
          // Check if any messages from this chat have been sent to Slack
          const existingSlackMessage = await getExistingSlackMessageForChat(messageContext.chatId);

          let slackResult: Awaited<ReturnType<typeof sendSlackNotification>>;

          if (
            existingSlackMessage?.exists &&
            existingSlackMessage.slackThreadTs &&
            existingSlackMessage.channelId &&
            existingSlackMessage.integrationId
          ) {
            logger.log('Found existing Slack thread for chat, sending as reply', {
              messageId: payload.messageId,
              chatId: messageContext.chatId,
              threadTs: existingSlackMessage.slackThreadTs,
            });

            // Need to get integration details to get the token vault key
            const db = await dbInitialized;
            const [integration] = await db
              .select({ tokenVaultKey: slackIntegrations.tokenVaultKey })
              .from(slackIntegrations)
              .where(eq(slackIntegrations.id, existingSlackMessage.integrationId))
              .limit(1);

            if (!integration?.tokenVaultKey) {
              logger.error('Could not find integration token for reply', {
                integrationId: existingSlackMessage.integrationId,
              });
              slackResult = { sent: false, error: 'Integration not found' };
            } else {
              slackResult = await sendSlackReplyNotification({
                organizationId: messageContext.organizationId,
                userName: messageContext.userName,
                chatId: messageContext.chatId,
                summaryTitle: dbData.summary_title,
                summaryMessage: dbData.summary_message,
                toolCalled: dbData.tool_called,
                threadTs: existingSlackMessage.slackThreadTs,
                channelId: existingSlackMessage.channelId,
                integrationId: existingSlackMessage.integrationId,
                tokenVaultKey: integration.tokenVaultKey,
              });
            }
          } else {
            logger.log('No existing Slack thread found, sending as new message', {
              messageId: payload.messageId,
              chatId: messageContext.chatId,
            });

            slackResult = await sendSlackNotification({
              organizationId: messageContext.organizationId,
              userName: messageContext.userName,
              chatId: messageContext.chatId,
              summaryTitle: dbData.summary_title,
              summaryMessage: dbData.summary_message,
              toolCalled: dbData.tool_called,
            });
          }

          if (slackResult.sent) {
            slackNotificationSent = true;
            logger.log('Slack notification sent successfully', {
              messageId: payload.messageId,
              organizationId: messageContext.organizationId,
              isReply: !!existingSlackMessage?.exists,
            });

            // Track the sent notification
            if (slackResult.messageTs && slackResult.integrationId && slackResult.channelId) {
              await trackSlackNotification({
                messageId: payload.messageId,
                integrationId: slackResult.integrationId,
                channelId: slackResult.channelId,
                messageTs: slackResult.messageTs,
                ...(slackResult.threadTs && { threadTs: slackResult.threadTs }),
                userName: messageContext.userName,
                chatId: messageContext.chatId,
                summaryTitle: dbData.summary_title,
                summaryMessage: dbData.summary_message,
                ...(slackResult.slackBlocks && { slackBlocks: slackResult.slackBlocks }),
              });
            }
          } else {
            logger.log('Slack notification not sent', {
              messageId: payload.messageId,
              organizationId: messageContext.organizationId,
              reason: slackResult.error,
            });
          }
        }
      } catch (slackError) {
        const errorMessage =
          slackError instanceof Error ? slackError.message : 'Unknown Slack error';
        logger.error('Failed to send Slack notification', {
          messageId: payload.messageId,
          organizationId: messageContext.organizationId,
          error: errorMessage,
        });
        console.error('Failed to send Slack notification:', {
          messageId: payload.messageId,
          organizationId: messageContext.organizationId,
          error: errorMessage,
          stack: slackError instanceof Error ? slackError.stack : undefined,
        });
        // Don't throw - this is a non-critical error
      }

      logger.log('Message post-processing completed successfully', {
        messageId: payload.messageId,
        executionTimeMs: Date.now() - startTime,
        slackNotificationSent,
      });

      // Need to flush the Braintrust logger to ensure all traces are sent
      await braintrustLogger.flush();

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

      console.error('Post-processing task execution failed:', {
        messageId: payload.messageId,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        executionTimeMs: Date.now() - startTime,
      });

      // Need to flush the Braintrust logger to ensure all traces are sent
      await braintrustLogger.flush();

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
    if (error.message.includes('workflow') || error.message.includes('Workflow')) {
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
