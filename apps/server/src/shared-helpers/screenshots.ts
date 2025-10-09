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

  if (!hasReferrer || cooldownCheckingTags.has(tag)) {
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

    return !lastTask;
  } catch (error) {
    console.error('Error checking if screenshot should be taken', { error });
    throw error;
  } finally {
    setTimeout(() => {
      cooldownCheckingTags.delete(tag);
    }, CACHE_TAG_EXPIRATION_TIME);
  }
};

/**
 * Generic handler to conditionally trigger screenshot tasks
 * @template TTrigger - The trigger payload type for the screenshot task
 */
export async function triggerScreenshotIfNeeded<TTrigger>({
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
}): Promise<void> {
  if (
    shouldTrigger &&
    (await shouldTakeScreenshot({
      tag,
      key,
      context,
    }))
  ) {
    tasks.trigger(key, payload, { tags: [tag], idempotencyKey: tag });
  }
}
