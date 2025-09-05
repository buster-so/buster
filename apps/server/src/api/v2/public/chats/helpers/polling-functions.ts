import { chats, db, eq, messages } from '@buster/database';
import { PublicChatError, PublicChatErrorCode } from '@buster/server-shared';
import type { ChatMessage } from '@buster/server-shared/chats';
import { runs } from '@trigger.dev/sdk';
import { DEFAULT_MESSAGES, POLLING_CONFIG } from '../constants';

export interface PollingConfig {
  initialDelayMs: number;
  intervalMs: number;
  maxDurationMs: number;
  backoffMultiplier?: number;
  maxIntervalMs?: number;
}

export interface MessageCompletionResult {
  isCompleted: boolean;
  responseMessage?: string;
  triggerRunId?: string | null;
  fileInfo?: {
    fileId: string | null;
    fileType: string | null;
    versionNumber: number | null;
  };
}

export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELED'
  | 'UNKNOWN';

export interface CombinedStatus {
  messageCompleted: boolean;
  jobStatus: JobStatus;
  responseMessage?: string | undefined;
  fileInfo?:
    | {
        fileId: string | null;
        fileType: string | null;
        versionNumber: number | null;
      }
    | undefined;
}

/**
 * Default polling configuration
 */
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  initialDelayMs: POLLING_CONFIG.INITIAL_DELAY_MS,
  intervalMs: POLLING_CONFIG.INTERVAL_MS,
  maxDurationMs: POLLING_CONFIG.MAX_DURATION_MS,
  backoffMultiplier: POLLING_CONFIG.BACKOFF_MULTIPLIER,
  maxIntervalMs: POLLING_CONFIG.MAX_INTERVAL_MS,
};

/**
 * Checks if a message is completed
 * @param messageId The message ID to check
 * @returns Completion status and response data
 */
export async function checkMessageCompletion(messageId: string): Promise<MessageCompletionResult> {
  try {
    // Query the message to check completion status
    const messageData = await db
      .select({
        isCompleted: messages.isCompleted,
        responseMessages: messages.responseMessages,
        chatId: messages.chatId,
        triggerRunId: messages.triggerRunId,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    const message = messageData[0];
    if (!message) {
      throw new PublicChatError(
        PublicChatErrorCode.MESSAGE_PROCESSING_FAILED,
        'Message not found',
        404
      );
    }

    // If not completed, return early with trigger run ID
    if (!message.isCompleted) {
      return { isCompleted: false, triggerRunId: message.triggerRunId };
    }

    // Extract the final response message
    let responseMessage: string = DEFAULT_MESSAGES.PROCESSING_COMPLETE;
    if (message.responseMessages) {
      // responseMessages is a record/object, not an array
      const responseMessagesRecord = message.responseMessages as ChatMessage['response_messages'];
      const responseMessagesArray = Object.values(responseMessagesRecord);

      const finalTextMessage = responseMessagesArray.find(
        (msg) => msg.type === 'text' && msg.is_final_message === true
      );

      if (finalTextMessage && finalTextMessage.type === 'text') {
        responseMessage = finalTextMessage.message;
      }
    }

    // Get file information from the chat
    const chatData = await db
      .select({
        mostRecentFileId: chats.mostRecentFileId,
        mostRecentFileType: chats.mostRecentFileType,
        mostRecentVersionNumber: chats.mostRecentVersionNumber,
      })
      .from(chats)
      .where(eq(chats.id, message.chatId))
      .limit(1);

    const chat = chatData[0];

    const fileInfo = chat
      ? {
          fileId: chat.mostRecentFileId,
          fileType: chat.mostRecentFileType,
          versionNumber: chat.mostRecentVersionNumber,
        }
      : undefined;

    return {
      isCompleted: true,
      responseMessage,
      ...(fileInfo && { fileInfo }),
    };
  } catch (error) {
    if (error instanceof PublicChatError) {
      throw error;
    }
    console.error('Error checking message completion:', error);
    throw new PublicChatError(
      PublicChatErrorCode.MESSAGE_PROCESSING_FAILED,
      'Failed to check message status',
      500
    );
  }
}

/**
 * Polls for message completion with exponential backoff
 * @param messageId The message ID to poll
 * @param config Polling configuration
 * @param onProgress Optional callback for progress updates
 * @returns The completion result
 */
export async function pollMessageCompletion(
  messageId: string,
  config: PollingConfig = DEFAULT_POLLING_CONFIG,
  onProgress?: (attempt: number, nextDelayMs: number) => void
): Promise<MessageCompletionResult> {
  const startTime = Date.now();
  let currentInterval = config.intervalMs;
  let attempt = 0;

  // Initial delay before first check
  await sleep(config.initialDelayMs);

  while (Date.now() - startTime < config.maxDurationMs) {
    attempt++;

    // Check completion status
    const result = await checkMessageCompletion(messageId);

    if (result.isCompleted) {
      return result;
    }

    // Calculate next interval with backoff
    if (config.backoffMultiplier && config.maxIntervalMs) {
      currentInterval = Math.min(currentInterval * config.backoffMultiplier, config.maxIntervalMs);
    }

    // Notify progress if callback provided
    if (onProgress) {
      onProgress(attempt, currentInterval);
    }

    // Check if we've already exceeded max duration
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= config.maxDurationMs) {
      break;
    }

    // Calculate remaining time and wait for the minimum of interval or remaining time
    const remainingTime = config.maxDurationMs - elapsedTime;
    const waitTime = Math.min(currentInterval, remainingTime);

    // Wait before next check
    await sleep(waitTime);
  }

  // Timeout reached
  throw new PublicChatError(
    PublicChatErrorCode.MESSAGE_PROCESSING_FAILED,
    'Message processing timed out',
    504
  );
}

/**
 * Sleep utility function
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check the status of a trigger job
 * @param triggerRunId The trigger run ID
 * @returns The job status
 */
export async function checkTriggerJobStatus(triggerRunId: string | null): Promise<JobStatus> {
  if (!triggerRunId) {
    return 'UNKNOWN';
  }

  try {
    const run = await runs.retrieve(triggerRunId);

    // Trigger.dev v3 uses simple status strings
    // Map them to our JobStatus type
    const status = run.status as string;

    if (status === 'COMPLETED') {
      return 'COMPLETED';
    }
    if (status === 'FAILED') {
      return 'FAILED';
    }
    if (status === 'CANCELED') {
      return 'CANCELED';
    }
    if (status === 'EXECUTING') {
      return 'EXECUTING';
    }
    if (status === 'QUEUED' || status === 'PENDING') {
      return 'QUEUED';
    }

    // For any other status, return EXECUTING to keep polling
    return 'EXECUTING';
  } catch (error) {
    console.error('Error checking trigger job status:', error);
    // If we can't check the status, assume it's still running
    return 'UNKNOWN';
  }
}

/**
 * Check both message completion and trigger job status
 * @param messageId The message ID
 * @returns Combined status information
 */
export async function checkCombinedStatus(messageId: string): Promise<CombinedStatus> {
  const messageResult = await checkMessageCompletion(messageId);
  const jobStatus = await checkTriggerJobStatus(messageResult.triggerRunId || null);

  return {
    messageCompleted: messageResult.isCompleted,
    jobStatus,
    responseMessage: messageResult.responseMessage,
    fileInfo: messageResult.fileInfo,
  };
}

/**
 * Creates an async generator for polling
 * Useful for SSE streaming
 * @param messageId The message ID to poll
 * @param config Polling configuration
 */
export async function* createPollingGenerator(
  messageId: string,
  config: PollingConfig = DEFAULT_POLLING_CONFIG
): AsyncGenerator<{ status: 'pending' | 'completed'; result?: MessageCompletionResult }> {
  const startTime = Date.now();
  let currentInterval = config.intervalMs;

  // Initial delay
  await sleep(config.initialDelayMs);

  while (true) {
    // Check if we've exceeded max duration before attempting
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime >= config.maxDurationMs) {
      break;
    }

    // Check completion status
    const result = await checkMessageCompletion(messageId);

    if (result.isCompleted) {
      yield { status: 'completed', result };
      return;
    }

    // Yield pending status
    yield { status: 'pending' };

    // Calculate next interval with backoff
    if (config.backoffMultiplier && config.maxIntervalMs) {
      currentInterval = Math.min(currentInterval * config.backoffMultiplier, config.maxIntervalMs);
    }

    // Check if we'll exceed max duration
    if (Date.now() - startTime + currentInterval >= config.maxDurationMs) {
      break;
    }

    // Wait before next check
    await sleep(currentInterval);
  }

  // Timeout
  throw new PublicChatError(
    PublicChatErrorCode.MESSAGE_PROCESSING_FAILED,
    'Message processing timed out',
    504
  );
}
