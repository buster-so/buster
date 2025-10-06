import { getPermissionedDatasets } from '@buster/access-controls';
import postProcessingWorkflow, {
  type PostProcessingWorkflowOutput,
} from '@buster/ai/workflows/message-post-processing-workflow/message-post-processing-workflow';
import { db, eq, getDb } from '@buster/database/connection';
import {
  getBraintrustMetadata,
  getChatConversationHistory,
  getLogsWriteBackConfig,
  getMessageContext,
  getOrganizationAnalystDoc,
  getOrganizationDataSource,
  getOrganizationDocs,
  getUserPersonalization,
} from '@buster/database/queries';
import { messages, slackIntegrations, users } from '@buster/database/schema';
import type {
  AssumptionClassification,
  AssumptionLabel,
  ConfidenceScore,
  PostProcessingMessage,
} from '@buster/server-shared/message';
import { logger, schemaTask, tasks } from '@trigger.dev/sdk/v3';
import { currentSpan, initLogger, wrapTraced } from 'braintrust';
import { z } from 'zod/v4';
import type { logsWriteBackTask } from '../logs-write-back';
import {
  buildWorkflowInput,
  fetchPreviousPostProcessingMessages,
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

      // Step 1: Parallelize ALL database queries for maximum speed (matching analyst agent pattern)
      const messageContextPromise = getMessageContext({ messageId: payload.messageId });
      const conversationHistoryPromise = getChatConversationHistory({
        messageId: payload.messageId,
      });

      // Start loading data source as soon as we have the required IDs
      const dataSourcePromise = messageContextPromise.then((context) =>
        getOrganizationDataSource({ organizationId: context.organizationId })
      );

      // Fetch user's datasets as soon as we have the userId
      const datasetsPromise = messageContextPromise.then(async (context) => {
        try {
          const datasets = await getPermissionedDatasets({
            userId: context.userId,
            page: 0,
            pageSize: 1000,
          });
          return datasets.datasets;
        } catch (error) {
          logger.error('Failed to fetch datasets for user', {
            userId: context.userId,
            messageId: payload.messageId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return [];
        }
      });

      // Fetch user personalization config
      const userPersonalizationConfigPromise = messageContextPromise.then((context) =>
        getUserPersonalization(context.userId)
      );

      // Fetch Braintrust metadata in parallel
      const braintrustMetadataPromise = getBraintrustMetadata({ messageId: payload.messageId });

      // Fetch analyst instructions in parallel
      const analystInstructionsPromise = messageContextPromise.then((context) =>
        getOrganizationAnalystDoc({ organizationId: context.organizationId })
      );

      // Fetch all organization docs (data catalog docs) in parallel
      const organizationDocsPromise = messageContextPromise.then((context) =>
        getOrganizationDocs({ organizationId: context.organizationId })
      );

      // Fetch userName separately (not included in getMessageContext)
      const userNamePromise = messageContextPromise.then(async (context) => {
        const db = getDb();
        const [user] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, context.userId))
          .limit(1);
        return user?.name || user?.email || 'Unknown';
      });

      // Fetch previous post-processing results (needs messageContext for chatId and timestamp)
      const previousPostProcessingPromise = messageContextPromise.then(async (context) => {
        // Need to get createdAt from messages table
        const db = getDb();
        const [msg] = await db
          .select({ createdAt: messages.createdAt })
          .from(messages)
          .where(eq(messages.id, payload.messageId))
          .limit(1);

        if (!msg) throw new MessageNotFoundError(payload.messageId);

        return fetchPreviousPostProcessingMessages(context.chatId, new Date(msg.createdAt));
      });

      // Fetch existing Slack message info
      const existingSlackMessagePromise = messageContextPromise.then((context) =>
        getExistingSlackMessageForChat(context.chatId)
      );

      // Wait for all operations to complete
      const [
        messageContext,
        conversationHistory,
        dataSource,
        datasets,
        braintrustMetadata,
        analystInstructions,
        organizationDocs,
        userPersonalizationConfig,
        userName,
        previousPostProcessingResults,
        existingSlackMessage,
      ] = await Promise.all([
        messageContextPromise,
        conversationHistoryPromise,
        dataSourcePromise,
        datasetsPromise,
        braintrustMetadataPromise,
        analystInstructionsPromise,
        organizationDocsPromise,
        userPersonalizationConfigPromise,
        userNamePromise,
        previousPostProcessingPromise,
        existingSlackMessagePromise,
      ]);

      logger.log('Fetched required data', {
        messageId: payload.messageId,
        previousPostProcessingCount: previousPostProcessingResults.length,
        datasetsCount: datasets.length,
        organizationId: messageContext.organizationId,
        dataSourceId: dataSource.dataSourceId,
        dataSourceSyntax: dataSource.dataSourceSyntax,
        organizationDocsCount: organizationDocs.length,
        braintrustMetadata, // Log the metadata to verify it's working
        slackMessageExists: existingSlackMessage?.exists || false,
        hasConversationHistory: conversationHistory.length > 0,
        hasAnalystInstructions: !!analystInstructions,
        hasUserPersonalization: !!userPersonalizationConfig,
      });

      // Step 3: Build workflow input
      const workflowInput = buildWorkflowInput(
        conversationHistory,
        previousPostProcessingResults,
        datasets,
        dataSource.dataSourceSyntax,
        userName,
        existingSlackMessage?.exists || false,
        userPersonalizationConfig || null,
        analystInstructions,
        organizationDocs
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

      const dbData = extractDbFields(validatedOutput, userName);

      try {
        const db = getDb();
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

      // Skip Slack notification if no issues were flagged and there are no major assumptions
      const hasMajorAssumptions =
        dbData.assumptions?.some((assumption) => assumption.label === 'major') ?? false;
      const shouldSkipSlackNotification =
        validatedOutput.flagChatResult.type === 'noIssuesFound' && !hasMajorAssumptions;

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
            const db = getDb();
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
                userName: userName,
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
              userName: userName,
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
                userName: userName,
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

      // Step 8: Trigger logs write-back task if configured
      try {
        // Check if organization has logs write-back configured
        const logsWriteBackConfig = await getLogsWriteBackConfig(messageContext.organizationId);

        if (logsWriteBackConfig) {
          logger.log('Triggering logs write-back task', {
            messageId: payload.messageId,
            organizationId: messageContext.organizationId,
          });

          // Fire-and-forget trigger to logs write-back task
          tasks
            .trigger<typeof logsWriteBackTask>('logs-write-back', {
              messageId: payload.messageId,
              organizationId: messageContext.organizationId,
            })
            .catch((error) => {
              // Log error but don't fail the current task
              logger.error('Failed to trigger logs write-back task', {
                messageId: payload.messageId,
                organizationId: messageContext.organizationId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            });
        }
      } catch (logsError) {
        // Log error but don't fail the task for logs write-back issues
        logger.error('Error checking logs write-back configuration', {
          messageId: payload.messageId,
          organizationId: messageContext.organizationId,
          error: logsError instanceof Error ? logsError.message : 'Unknown error',
        });
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
