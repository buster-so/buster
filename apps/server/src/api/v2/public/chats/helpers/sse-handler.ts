import type { Context } from 'hono';
import { streamSSE } from 'hono/streaming';
import { DEFAULT_MESSAGES, POLLING_CONFIG } from '../constants';
import { buildChatLink } from './chat-functions';
import { checkCombinedStatus } from './polling-functions';

/**
 * Create an SSE stream for a public chat using Hono's streamSSE helper
 * @param c Hono context
 * @param chatId The chat ID
 * @param messageId The message ID to poll
 * @returns SSE response
 */
export async function createPublicChatSSEStream(c: Context, chatId: string, messageId: string) {
  return streamSSE(c, async (stream) => {
    const startTime = Date.now();
    let eventId = 0;

    // Send initial status event
    await stream.writeSSE({
      data: JSON.stringify({
        type: 'status',
        message: DEFAULT_MESSAGES.PROCESSING_START,
        link: buildChatLink(chatId),
      }),
      event: 'status',
      id: String(eventId++),
    });

    // Set up status update interval
    const statusInterval = setInterval(async () => {
      try {
        const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'status',
            message: `${DEFAULT_MESSAGES.STILL_PROCESSING} (${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''} elapsed)`,
          }),
          event: 'status',
          id: String(eventId++),
        });
      } catch (error) {
        console.error('Error sending status update:', error);
        clearInterval(statusInterval);
      }
    }, POLLING_CONFIG.STATUS_UPDATE_INTERVAL_MS);

    // Clean up on disconnect
    stream.onAbort(() => {
      clearInterval(statusInterval);
      console.info(`SSE connection aborted for chat ${chatId}`);
    });

    try {
      // Initial delay before starting to poll
      await sleep(POLLING_CONFIG.INITIAL_DELAY_MS);

      let currentInterval: number = POLLING_CONFIG.INTERVAL_MS;

      // Poll for completion
      while (Date.now() - startTime < POLLING_CONFIG.MAX_DURATION_MS) {
        // Check combined status (message + job)
        const status = await checkCombinedStatus(messageId);

        // Check if message is completed successfully
        if (status.messageCompleted) {
          // Send final response
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'response',
              message: status.responseMessage || DEFAULT_MESSAGES.PROCESSING_COMPLETE_GENERIC,
              link: buildChatLink(
                chatId,
                status.fileInfo?.fileId,
                status.fileInfo?.fileType,
                status.fileInfo?.versionNumber
              ),
              is_finished: true,
            }),
            event: 'response',
            id: String(eventId++),
          });
          break;
        }

        // Check if job failed but message is not completed
        if (status.jobStatus === 'FAILED' || status.jobStatus === 'CANCELED') {
          const errorMessage =
            status.jobStatus === 'CANCELED'
              ? 'The request was canceled'
              : DEFAULT_MESSAGES.ERROR_JOB_FAILED;

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'error',
              error: errorMessage,
            }),
            event: 'error',
            id: String(eventId++),
          });
          break;
        }

        // Check if job completed but message is not completed (indicates error)
        if (status.jobStatus === 'COMPLETED' && !status.messageCompleted) {
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'error',
              error: 'Processing completed but no response was generated. Please try again.',
            }),
            event: 'error',
            id: String(eventId++),
          });
          break;
        }

        // Apply backoff to polling interval
        if (POLLING_CONFIG.BACKOFF_MULTIPLIER && POLLING_CONFIG.MAX_INTERVAL_MS) {
          currentInterval = Math.min(
            Math.floor(currentInterval * POLLING_CONFIG.BACKOFF_MULTIPLIER),
            POLLING_CONFIG.MAX_INTERVAL_MS
          );
        }

        // Calculate remaining time and wait
        const elapsedTime = Date.now() - startTime;
        const remainingTime = POLLING_CONFIG.MAX_DURATION_MS - elapsedTime;

        if (remainingTime <= 0) {
          break;
        }

        const waitTime = Math.min(currentInterval, remainingTime);
        await sleep(waitTime);
      }

      // Check if we timed out
      if (Date.now() - startTime >= POLLING_CONFIG.MAX_DURATION_MS) {
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            error: DEFAULT_MESSAGES.ERROR_TIMEOUT,
          }),
          event: 'error',
          id: String(eventId++),
        });
      }
    } catch (error) {
      console.error('Error in SSE stream:', error);

      // Send error event
      const errorMessage = error instanceof Error ? error.message : DEFAULT_MESSAGES.ERROR_GENERIC;

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          error: errorMessage,
        }),
        event: 'error',
        id: String(eventId++),
      });
    } finally {
      // Clean up
      clearInterval(statusInterval);

      // Stream cleanup is automatic with Hono's streamSSE
    }
  });
}

/**
 * Sleep utility function
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
