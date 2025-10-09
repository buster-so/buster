import { db, eq } from '@buster/database/connection';
import { checkForDuplicateMessages, updateMessage } from '@buster/database/queries';
import { chats, messages } from '@buster/database/schema';
import type { AssetType } from '@buster/server-shared';
import {
  SlackMessagingService,
  addReaction,
  convertMarkdownToSlack,
  getThreadMessages,
  removeReaction,
} from '@buster/slack';
import { type TaskOutput, logger, runs, schemaTask, wait } from '@trigger.dev/sdk';
import { z } from 'zod';
import type { AnalystAgentTaskInput } from '../analyst-agent-task';
import { analystAgentTask } from '../analyst-agent-task/analyst-agent-task';
import {
  createMessage,
  filterMessagesAfterLastMention,
  getChatDetails,
  getOrganizationSlackIntegration,
} from './helpers';

const SlackAgentTaskInputSchema = z.object({
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
});

const SlackAgentTaskOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string().uuid(),
  triggerRunId: z.string(),
});

export type SlackAgentTaskInput = z.infer<typeof SlackAgentTaskInputSchema>;
export type SlackAgentTaskOutput = z.infer<typeof SlackAgentTaskOutputSchema>;

export const slackAgentTask: ReturnType<
  typeof schemaTask<'slack-agent-task', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>
> = schemaTask<'slack-agent-task', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>({
  id: 'slack-agent-task',
  schema: SlackAgentTaskInputSchema,
  maxDuration: 600, // needs to be the same or longer than the analyst agent task since we wait for it to complete.
  run: async (payload: SlackAgentTaskInput): Promise<SlackAgentTaskOutput> => {
    try {
      logger.log('Starting Slack agent task', {
        chatId: payload.chatId,
        userId: payload.userId,
      });

      // Step 1: Get chat details first (we need this for everything else)
      const chatDetails = await getChatDetails(payload.chatId);

      if (!chatDetails.slackChannelId || !chatDetails.slackThreadTs) {
        throw new Error('Chat is missing Slack channel or thread information');
      }

      logger.log('Retrieved chat details', {
        chatId: payload.chatId,
        organizationId: chatDetails.organizationId,
        slackChannelId: chatDetails.slackChannelId,
        slackThreadTs: chatDetails.slackThreadTs,
        slackChatAuthorization: chatDetails.chat.slackChatAuthorization,
      });

      // Step 2: Get Slack integration for access token
      const { integration, accessToken } = await getOrganizationSlackIntegration(
        chatDetails.organizationId
      );

      // Check if user is unauthorized
      if (chatDetails.chat.slackChatAuthorization === 'unauthorized') {
        logger.log('User is unauthorized, sending message to Slack thread');

        const messagingService = new SlackMessagingService();
        const unauthorizedMessage = {
          text: "It looks like you haven't been added to this Buster workspace. One of your workspace admins will need to add you before you can send requests.",
          thread_ts: chatDetails.slackThreadTs,
        };

        try {
          await messagingService.sendMessage(
            accessToken,
            chatDetails.slackChannelId,
            unauthorizedMessage
          );
          logger.log('Sent unauthorized message to Slack thread');
        } catch (error) {
          logger.error('Failed to send unauthorized message to Slack', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Return early - don't process the request
        return {
          success: false,
          messageId: '',
          triggerRunId: '',
        };
      }

      logger.log('Retrieved Slack integration', {
        organizationId: chatDetails.organizationId,
        teamId: integration.teamId,
        teamName: integration.teamName,
        botUserId: integration.botUserId,
      });

      // Step 3: Fetch all needed data concurrently
      const [slackMessages] = await Promise.all([
        getThreadMessages({
          accessToken,
          channelId: chatDetails.slackChannelId,
          threadTs: chatDetails.slackThreadTs,
        }),
        // Add more concurrent fetches here if needed
      ]);

      logger.log('Retrieved Slack thread messages', {
        messageCount: slackMessages.length,
        hasParentMessage: slackMessages.length > 0,
      });

      // Check if this is a DM (channel ID starts with 'D')
      const isDM = chatDetails.slackChannelId?.startsWith('D') || false;

      // Filter messages to only include non-bot messages after the most recent app mention
      if (!integration.botUserId) {
        logger.error('No bot user ID found for Slack integration');
        throw new Error('Slack integration is missing bot user ID');
      }

      let relevantMessages: typeof slackMessages;
      let mentionMessageTs: string | null;

      if (isDM) {
        // For DMs, we don't need to look for mentions - all messages are for the bot
        // Use the most recent message timestamp as the "mention" timestamp for reactions
        relevantMessages = slackMessages.filter((msg) => msg.user !== integration.botUserId);
        mentionMessageTs =
          relevantMessages.length > 0
            ? relevantMessages[relevantMessages.length - 1]?.ts || null
            : null;

        logger.log('Processing DM messages', {
          originalCount: slackMessages.length,
          filteredCount: relevantMessages.length,
          botUserId: integration.botUserId,
          mentionMessageTs,
        });
      } else {
        // For channel messages, look for @Buster mentions
        const filterResult = filterMessagesAfterLastMention(slackMessages, integration.botUserId);
        relevantMessages = filterResult.filteredMessages;
        mentionMessageTs = filterResult.mentionMessageTs;

        logger.log('Filtered channel messages', {
          originalCount: slackMessages.length,
          filteredCount: relevantMessages.length,
          botUserId: integration.botUserId,
          mentionMessageTs,
        });

        // If no mention was found in a channel, we can't proceed
        if (!mentionMessageTs) {
          logger.error('No @Buster mention found in channel thread');
          throw new Error('No @Buster mention found in the channel thread');
        }
      }

      // If no relevant timestamp found (shouldn't happen), we can't proceed
      if (!mentionMessageTs) {
        logger.error('No message timestamp found for reactions');
        throw new Error('No message timestamp found to react to');
      }

      // Find all bot messages in the thread to determine if this is a follow-up
      const previousBotMessages = slackMessages.filter(
        (msg) => msg.user === integration.botUserId && msg.ts < mentionMessageTs
      );
      const isFollowUp = previousBotMessages.length > 0;

      // Get all messages for context, not just after the mention
      let messagesToInclude: typeof slackMessages;

      if (isDM) {
        // For DMs, handle follow-ups differently
        if (isFollowUp) {
          // Find the timestamp of the last bot message
          const lastBotMessageTs = Math.max(
            ...previousBotMessages.map((msg) => Number.parseFloat(msg.ts))
          );
          const lastBotMessageIndex = slackMessages.findIndex(
            (msg) => Number.parseFloat(msg.ts) === lastBotMessageTs
          );

          // Include messages after the last bot response
          messagesToInclude = slackMessages.slice(lastBotMessageIndex + 1);
        } else {
          // Include all messages for first request
          messagesToInclude = slackMessages;
        }
      } else {
        // For channel messages, use the existing logic
        if (isFollowUp) {
          // Find the timestamp of the last bot message before the current mention
          const lastBotMessageTs = Math.max(
            ...previousBotMessages.map((msg) => Number.parseFloat(msg.ts))
          );
          const lastBotMessageIndex = slackMessages.findIndex(
            (msg) => Number.parseFloat(msg.ts) === lastBotMessageTs
          );

          // Include messages after the last bot response
          messagesToInclude = slackMessages.slice(lastBotMessageIndex + 1);
        } else {
          // Include all messages in the thread for first request
          messagesToInclude = slackMessages;
        }
      }

      // Filter out bot messages and format the conversation
      const formattedMessages = messagesToInclude
        .filter((msg) => msg.user !== integration.botUserId) // Exclude bot messages
        .map((msg) => {
          let text = msg.text || '';
          // Replace bot user ID mentions with @Buster for consistency
          if (integration.botUserId) {
            text = text.replace(new RegExp(`<@${integration.botUserId}>`, 'g'), '@Buster');
          }
          return `> ${text}`;
        })
        .filter((text) => text.trim() !== '>')
        .join('\n');

      // Check if no messages found - reply directly to Slack
      if (!formattedMessages.trim()) {
        logger.log('No messages found after filtering, responding directly to Slack');

        const messagingService = new SlackMessagingService();

        try {
          const noRequestMessage = {
            text: "I couldn't find any requests in this conversation. Please send me a message with your question or request.",
            thread_ts: chatDetails.slackThreadTs,
          };

          await messagingService.sendMessage(
            accessToken,
            chatDetails.slackChannelId,
            noRequestMessage
          );

          logger.log('Sent no requests message to Slack thread');
        } catch (error) {
          logger.error('Failed to send no requests message to Slack', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Update reactions - remove hourglass, add X mark on the mention message
        try {
          // Remove the hourglass reaction
          await removeReaction({
            accessToken,
            channelId: chatDetails.slackChannelId,
            messageTs: mentionMessageTs,
            emoji: 'hourglass_flowing_sand',
          });

          // Add the X mark reaction to indicate no request found
          await addReaction({
            accessToken,
            channelId: chatDetails.slackChannelId,
            messageTs: mentionMessageTs,
            emoji: 'x',
          });

          logger.log('Updated Slack reactions on mention message (no request found)', {
            messageTs: mentionMessageTs,
          });
        } catch (error) {
          logger.warn('Failed to update Slack reactions for no request case', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        return {
          success: true,
          messageId: '',
          triggerRunId: '',
        };
      }

      // Generate prompt based on whether it's first message or follow-up
      let prompt: string;
      if (isFollowUp) {
        prompt = `Please fulfill the request from this slack conversation. Here are the messages since your last response:\n${formattedMessages}`;
      } else {
        prompt = `Please fulfill the request from this slack conversation:\n${formattedMessages}`;
      }

      // Check for duplicate messages before creating
      const duplicateCheck = await checkForDuplicateMessages({
        chatId: payload.chatId,
        requestMessage: prompt,
      });

      if (duplicateCheck.isDuplicate) {
        logger.warn('Duplicate message detected, stopping task', {
          chatId: payload.chatId,
          duplicateMessageIds: duplicateCheck.duplicateMessageIds,
          requestMessage: prompt,
        });

        return {
          success: false,
          messageId: '',
          triggerRunId: '',
        };
      }

      // Step 4: Create message
      const message = await createMessage({
        chatId: payload.chatId,
        userId: payload.userId,
        content: prompt,
      });

      logger.log('Successfully created message', {
        chatId: payload.chatId,
        messageId: message.id,
      });

      // Step 5: Trigger analyst agent task (without waiting)
      logger.log('Triggering analyst agent task', {
        messageId: message.id,
      });

      const analystHandle = await analystAgentTask.trigger(
        {
          message_id: message.id,
          access_token: null,
        } satisfies AnalystAgentTaskInput,
        {
          concurrencyKey: payload.chatId, // Ensure sequential processing per chat
        }
      );

      logger.log('Analyst agent task triggered', {
        runId: analystHandle.id,
      });

      // Update the message with the trigger run ID
      if (!analystHandle.id) {
        throw new Error('Trigger service returned invalid handle');
      }

      try {
        await updateMessage(message.id, {
          triggerRunId: analystHandle.id,
        });

        logger.log('Updated message with trigger run ID', {
          messageId: message.id,
          triggerRunId: analystHandle.id,
        });
      } catch (updateError) {
        logger.error('Failed to update message with trigger run ID', {
          messageId: message.id,
          triggerRunId: analystHandle.id,
          error: updateError instanceof Error ? updateError.message : 'Unknown error',
        });
        // Don't throw here - continue with the flow since the task is already triggered
      }

      // Step 6: Initial fast polling to check if task starts quickly
      const messagingService = new SlackMessagingService();
      const busterUrl = process.env.BUSTER_URL || 'https://platform.buster.so';
      let progressMessageTs: string | undefined;
      let queuedMessageTs: string | undefined;
      let hasStartedRunning = false;

      // First, do rapid polling for up to 20 seconds to see if task starts
      const rapidPollInterval = 1000; // 1 second
      const maxRapidPolls = 20; // 20 attempts = 20 seconds total
      let rapidPollCount = 0;
      let isComplete = false;
      let analystResult: {
        ok: boolean;
        output?: unknown;
        error?: unknown;
        canceled?: boolean;
      } | null = null;

      while (rapidPollCount < maxRapidPolls && !hasStartedRunning && !isComplete) {
        await wait.for({ seconds: rapidPollInterval / 1000 });
        rapidPollCount++;

        try {
          const run = await runs.retrieve(analystHandle.id);

          logger.log('Rapid polling analyst task status', {
            runId: analystHandle.id,
            status: run.status,
            pollCount: rapidPollCount,
          });

          // Check if task has started
          if (run.status === 'EXECUTING') {
            hasStartedRunning = true;
            logger.log('Analyst task started executing during rapid poll', {
              runId: analystHandle.id,
              pollCount: rapidPollCount,
            });

            // Send the progress message
            try {
              const progressMessage = {
                text: "I've started working on your request. I'll notify you when it's finished.",
                thread_ts: chatDetails.slackThreadTs,
                blocks: [
                  {
                    type: 'section' as const,
                    text: {
                      type: 'mrkdwn' as const,
                      text: "I've started working on your request. I'll notify you when it's finished.",
                    },
                  },
                  {
                    type: 'actions' as const,
                    elements: [
                      {
                        type: 'button' as const,
                        text: {
                          type: 'plain_text' as const,
                          text: 'Open in Buster',
                          emoji: false,
                        },
                        url: `${busterUrl}/app/chats/${payload.chatId}`,
                      },
                    ],
                  },
                ],
              };

              const sendResult = await messagingService.sendMessage(
                accessToken,
                chatDetails.slackChannelId,
                progressMessage
              );

              if (sendResult.success && sendResult.messageTs) {
                progressMessageTs = sendResult.messageTs;
                logger.log('Sent progress message to Slack thread', {
                  messageTs: progressMessageTs,
                });
              }
            } catch (error) {
              logger.warn('Failed to send progress message to Slack', {
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          } else if (run.status === 'QUEUED' && rapidPollCount === maxRapidPolls) {
            // Still queued after 20 seconds, send the queued message
            logger.log('Analyst task is still queued after 20 seconds, notifying user', {
              runId: analystHandle.id,
            });

            try {
              const queuedMessage = {
                text: "It looks like I'm still running your previous request. When that finishes I'll start working on this one!",
                thread_ts: chatDetails.slackThreadTs,
              };

              const sendResult = await messagingService.sendMessage(
                accessToken,
                chatDetails.slackChannelId,
                queuedMessage
              );

              if (sendResult.success && sendResult.messageTs) {
                queuedMessageTs = sendResult.messageTs;
                logger.log('Sent queued message to Slack thread', { messageTs: queuedMessageTs });
              }
            } catch (error) {
              logger.warn('Failed to send queued message to Slack', {
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          } else if (
            run.status === 'COMPLETED' ||
            run.status === 'SYSTEM_FAILURE' ||
            run.status === 'CRASHED' ||
            run.status === 'CANCELED' ||
            run.status === 'TIMED_OUT'
          ) {
            // Task already completed or failed during rapid polling
            isComplete = true;
            if (run.status === 'COMPLETED') {
              analystResult = { ok: true, output: run.output };
            } else if (run.status === 'CANCELED') {
              analystResult = { ok: false, canceled: true };
            } else {
              analystResult = { ok: false, error: run.error || 'Task failed' };
            }
          }
        } catch (error) {
          logger.warn('Failed to retrieve run status during rapid poll', {
            error: error instanceof Error ? error.message : 'Unknown error',
            pollCount: rapidPollCount,
          });
        }
      }

      // Step 7: Main polling loop for task completion
      const maxPollingTime = 30 * 60 * 1000; // 30 minutes
      const normalPollingInterval = 10000; // 10 seconds
      const startTime = Date.now();

      while (!isComplete && Date.now() - startTime < maxPollingTime) {
        await wait.for({ seconds: normalPollingInterval / 1000 });

        try {
          const run = await runs.retrieve(analystHandle.id);

          logger.log('Polling analyst task status', {
            runId: analystHandle.id,
            status: run.status,
          });

          // Handle transition from queued to executing if we haven't sent progress message yet
          if (!hasStartedRunning && run.status === 'EXECUTING') {
            hasStartedRunning = true;
            logger.log('Analyst task has started executing', {
              runId: analystHandle.id,
              previouslyQueued: !!queuedMessageTs,
            });

            // If we sent a queued message, delete it first
            if (queuedMessageTs) {
              try {
                const deleteResult = await messagingService.deleteMessage(
                  accessToken,
                  chatDetails.slackChannelId,
                  queuedMessageTs
                );

                if (deleteResult.success) {
                  logger.log('Deleted queued message', { messageTs: queuedMessageTs });
                } else {
                  logger.warn('Failed to delete queued message', {
                    messageTs: queuedMessageTs,
                    error: deleteResult.error,
                  });
                }
              } catch (error) {
                logger.warn('Error deleting queued message', {
                  messageTs: queuedMessageTs,
                  error: error instanceof Error ? error.message : 'Unknown error',
                });
              }
            }

            // Send the progress message
            try {
              const progressMessage = {
                text: "I've started working on your request. I'll notify you when it's finished.",
                thread_ts: chatDetails.slackThreadTs,
                blocks: [
                  {
                    type: 'section' as const,
                    text: {
                      type: 'mrkdwn' as const,
                      text: "I've started working on your request. I'll notify you when it's finished.",
                    },
                  },
                  {
                    type: 'actions' as const,
                    elements: [
                      {
                        type: 'button' as const,
                        text: {
                          type: 'plain_text' as const,
                          text: 'Open in Buster',
                          emoji: false,
                        },
                        url: `${busterUrl}/app/chats/${payload.chatId}`,
                      },
                    ],
                  },
                ],
              };

              const sendResult = await messagingService.sendMessage(
                accessToken,
                chatDetails.slackChannelId,
                progressMessage
              );

              if (sendResult.success && sendResult.messageTs) {
                progressMessageTs = sendResult.messageTs;
                logger.log('Sent progress message to Slack thread', {
                  messageTs: progressMessageTs,
                });
              }
            } catch (error) {
              logger.warn('Failed to send progress message to Slack', {
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          // Check for completion or failure
          if (run.status === 'COMPLETED') {
            isComplete = true;
            analystResult = { ok: true, output: run.output };
          } else if (run.status === 'CANCELED') {
            isComplete = true;
            analystResult = { ok: false, canceled: true };
          } else if (
            run.status === 'SYSTEM_FAILURE' ||
            run.status === 'CRASHED' ||
            run.status === 'TIMED_OUT'
          ) {
            isComplete = true;
            analystResult = { ok: false, error: run.error || 'Task failed' };
          }
        } catch (error) {
          logger.warn('Failed to retrieve run status', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Check if we timed out
      if (!isComplete) {
        logger.error('Analyst task polling timed out');
        analystResult = { ok: false, error: 'Task timed out' };
      }

      if (analystResult && !analystResult.ok && analystResult.canceled) {
        logger.log('Analyst task was canceled mid-execution', {
          runId: analystHandle.id,
        });

        try {
          if (progressMessageTs) {
            await messagingService.deleteMessage(
              accessToken,
              chatDetails.slackChannelId,
              progressMessageTs
            );
          }

          await removeReaction({
            accessToken,
            channelId: chatDetails.slackChannelId,
            messageTs: mentionMessageTs,
            emoji: 'hourglass_flowing_sand',
          });
        } catch (error) {
          logger.warn(
            'Error cleaning up initial message and reaction after canceled analyst task',
            {
              messageTs: progressMessageTs,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          );
        }

        try {
          const canceledMessage =
            'Your request was canceled mid-execution. If this was a mistake, please ask your question again.';
          const messageBlocks = [
            {
              type: 'section' as const,
              text: {
                type: 'plain_text' as const,
                text: canceledMessage,
              },
            },
            {
              type: 'actions' as const,
              elements: [
                {
                  type: 'button' as const,
                  text: {
                    type: 'plain_text' as const,
                    text: 'Open in Buster',
                    emoji: false,
                  },
                  url: `${busterUrl}/app/chats/${payload.chatId}`,
                },
              ],
            },
          ];
          const completeCanceledMessage = {
            text: canceledMessage,
            thread_ts: chatDetails.slackThreadTs,
            blocks: messageBlocks,
          };

          await messagingService.sendMessage(
            accessToken,
            chatDetails.slackChannelId,
            completeCanceledMessage
          );
        } catch (error) {
          logger.warn('Failed to send canceled message to Slack', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        return {
          success: false,
          messageId: '',
          triggerRunId: '',
        };
      }

      // Handle analyst task result
      if (!analystResult || !analystResult.ok) {
        // If analyst task failed, notify the user
        logger.error('Analyst agent task failed', {
          error: analystResult?.error || 'Unknown error',
        });

        try {
          await messagingService.sendMessage(accessToken, chatDetails.slackChannelId, {
            text: `Sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.`,
            thread_ts: chatDetails.slackThreadTs,
          });
        } catch (error) {
          logger.warn('Failed to send error message to Slack', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        throw new Error(
          `Analyst agent task failed: ${JSON.stringify(analystResult?.error || 'Unknown error')}`
        );
      }

      // Step 8: Fetch the response message and chat details from the database
      let responseText = "I've finished working on your request!";
      let chatFileInfo: {
        mostRecentFileId: string | null;
        mostRecentFileType: AssetType | null;
        mostRecentVersionNumber: number | null;
      } | null = null;

      try {
        // Fetch both message and chat data in parallel
        const [messageData, chatData] = await Promise.all([
          db
            .select({ responseMessages: messages.responseMessages })
            .from(messages)
            .where(eq(messages.id, message.id))
            .limit(1),
          db
            .select({
              mostRecentFileId: chats.mostRecentFileId,
              mostRecentFileType: chats.mostRecentFileType,
              mostRecentVersionNumber: chats.mostRecentVersionNumber,
            })
            .from(chats)
            .where(eq(chats.id, payload.chatId))
            .limit(1),
        ]);

        const messageRecord = messageData[0];
        const chatRecord = chatData[0];

        if (messageRecord?.responseMessages) {
          // responseMessages is a JSON array, find the text message with is_final_message: true
          const responseArray = messageRecord.responseMessages as Array<{
            id: string;
            type: string;
            message?: string;
            is_final_message?: boolean;
          }>;

          const finalTextMessage = responseArray.find(
            (msg) => msg.type === 'text' && msg.is_final_message === true
          );

          if (finalTextMessage?.message) {
            responseText = finalTextMessage.message;
          }
        }

        if (chatRecord) {
          chatFileInfo = {
            mostRecentFileId: chatRecord.mostRecentFileId,
            mostRecentFileType: chatRecord.mostRecentFileType,
            mostRecentVersionNumber: chatRecord.mostRecentVersionNumber,
          };
        }
      } catch (error) {
        logger.warn('Failed to fetch data from database', {
          messageId: message.id,
          chatId: payload.chatId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Step 9: Delete the initial message and send a new one with the response
      if (progressMessageTs) {
        try {
          // First, delete the initial message
          const deleteResult = await messagingService.deleteMessage(
            accessToken,
            chatDetails.slackChannelId,
            progressMessageTs
          );

          if (deleteResult.success) {
            logger.log('Deleted initial progress message', {
              messageTs: progressMessageTs,
            });
          } else {
            logger.warn('Failed to delete initial message', {
              messageTs: progressMessageTs,
              error: deleteResult.error,
            });
          }
        } catch (error) {
          logger.warn('Error deleting initial message', {
            messageTs: progressMessageTs,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Send the completion message (whether or not the delete succeeded)
      try {
        // Construct the URL based on whether we have file information
        let buttonUrl = `${busterUrl}/app/chats/${payload.chatId}`;

        if (
          chatFileInfo?.mostRecentFileId &&
          chatFileInfo?.mostRecentFileType &&
          chatFileInfo?.mostRecentVersionNumber !== null
        ) {
          if (chatFileInfo.mostRecentFileType === 'dashboard_file') {
            buttonUrl += `/dashboards/${chatFileInfo.mostRecentFileId}?dashboard_version_number=${chatFileInfo.mostRecentVersionNumber}`;
          } else if (chatFileInfo.mostRecentFileType === 'metric_file') {
            buttonUrl += `/metrics/${chatFileInfo.mostRecentFileId}?metric_version_number=${chatFileInfo.mostRecentVersionNumber}`;
          } else if (chatFileInfo.mostRecentFileType === 'report_file') {
            buttonUrl += `/reports/${chatFileInfo.mostRecentFileId}?report_version_number=${chatFileInfo.mostRecentVersionNumber}`;
          } else {
            const _exhaustiveCheck: 'chat' | 'collection' = chatFileInfo.mostRecentFileType;
            buttonUrl = `${busterUrl}/app/chats/${payload.chatId}`;
          }
        }

        // Convert markdown to Slack format
        const convertedResponse = convertMarkdownToSlack(responseText);

        // Create the message with converted text and any blocks from conversion
        const messageBlocks = [...(convertedResponse.blocks || [])];

        // If no blocks were created from conversion, create a section block with the converted text
        if (messageBlocks.length === 0 && convertedResponse.text) {
          messageBlocks.push({
            type: 'section' as const,
            text: {
              type: 'mrkdwn' as const,
              text: convertedResponse.text,
            },
          });
        }

        // Add the action button block
        messageBlocks.push({
          type: 'actions' as const,
          elements: [
            {
              type: 'button' as const,
              text: {
                type: 'plain_text' as const,
                text: 'Open in Buster',
                emoji: false,
              },
              url: buttonUrl,
            },
          ],
        });

        const completionMessage = {
          text: convertedResponse.text || responseText, // Use converted text as fallback
          thread_ts: chatDetails.slackThreadTs,
          blocks: messageBlocks,
        };

        await messagingService.sendMessage(
          accessToken,
          chatDetails.slackChannelId,
          completionMessage
        );

        logger.log('Sent completion message to Slack thread', {
          buttonUrl,
          hasFileInfo: !!chatFileInfo?.mostRecentFileId,
        });
      } catch (error) {
        logger.error('Failed to send completion message to Slack', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Step 10: Update reactions - remove hourglass, add checkmark on the mention message
      try {
        // Remove the hourglass reaction
        await removeReaction({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: mentionMessageTs,
          emoji: 'hourglass_flowing_sand',
        });

        // Add the checkmark reaction
        await addReaction({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: mentionMessageTs,
          emoji: 'white_check_mark',
        });

        logger.log('Updated Slack reactions on mention message', {
          messageTs: mentionMessageTs,
        });
      } catch (error) {
        logger.warn('Failed to update Slack reactions', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return {
        success: true,
        messageId: message.id,
        triggerRunId: analystHandle.id,
      };
    } catch (error) {
      logger.error('Failed to process Slack agent task', {
        chatId: payload.chatId,
        userId: payload.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  },
});
