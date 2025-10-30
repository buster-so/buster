import type { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import { runs, tasks } from '@trigger.dev/sdk';
import type { Context } from 'hono';

// This helper ensures that we do not run multiple trigger jobs for the same screenshot task concurrently.
// It checks if a job for the given tag and key is already running or queued before starting a new one.

const cooldownCheckingTags = new Set<string>();
const CACHE_TAG_EXPIRATION_TIME = 1000 * 30; // 30 seconds

const shouldTakeScreenshot = async ({
  tag,
  key,
  context,
}: {
  tag: string;
  key: (typeof screenshots_task_keys)[keyof typeof screenshots_task_keys];
  context: Context;
}): Promise<boolean> => {
  const hasReferrer = !!context.req.header('referer');

  if (!hasReferrer || cooldownCheckingTags.has(tag) || process.env.IS_E2E_TEST === 'true') {
    return false;
  }

  cooldownCheckingTags.add(tag);

  try {
    const lastTask = await runs
      .list({
        status: ['EXECUTING', 'QUEUED'],
        taskIdentifier: key,
        tag,
        limit: 1,
      })
      .then((res) => res.data[0]);

    console.info('Last task', { lastTask });

    return !lastTask;
  } catch (error) {
    console.error('Error checking if screenshot should be taken', { error });
    return false; // Return false on error instead of throwing
  } finally {
    setTimeout(() => {
      cooldownCheckingTags.delete(tag);
    }, CACHE_TAG_EXPIRATION_TIME);
  }
};
/**
 * Generic handler to conditionally trigger screenshot tasks as a background job.
 * This function is fire-and-forget - it will not block the API response and will
 * catch all errors internally without throwing.
 * @template TTrigger - The trigger payload type for the screenshot task
 */
export function triggerScreenshotIfNeeded<TTrigger>({
  tag,
  key,
  context,
  payload,
  shouldTrigger = true,
}: {
  tag: string;
  key: (typeof screenshots_task_keys)[keyof typeof screenshots_task_keys];
  context: Context;
  payload: TTrigger;
  shouldTrigger?: boolean;
}): void {
  // Fire-and-forget: Run asynchronously without blocking
  (async () => {
    try {
      console.info('Trigger screenshot if needed', { tag, key, shouldTrigger });
      if (
        shouldTrigger &&
        (await shouldTakeScreenshot({
          tag,
          key,
          context,
        }))
      ) {
        console.info('Triggering screenshot', { tag, key, payload });
        // Fire-and-forget: Don't await the trigger call
        tasks.trigger(key, payload, { tags: [tag] }).catch((triggerError) => {
          console.error('Error in tasks.trigger', { tag, key, error: triggerError });
        });
        console.info('Screenshot trigger initiated', { tag, key });
      }
    } catch (error) {
      // Log but don't throw - this is a background job
      console.error('Error triggering screenshot', { tag, key, error });
    }
  })();
}
