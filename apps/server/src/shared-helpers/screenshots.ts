import type { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import { runs } from '@trigger.dev/sdk';
import type { Context } from 'hono';

// This helper ensures that we do not run multiple trigger jobs for the same screenshot task concurrently.
// It checks if a job for the given tag and key is already running or queued before starting a new one.

const currentlyCheckingTags = new Set<string>();
const CACHE_TAG_EXPIRATION_TIME = 1000 * 30; // 30 seconds

export const shouldTakeScreenshot = async ({
  tag,
  key,
  context,
}: {
  tag: string;
  key: (typeof screenshots_task_keys)[keyof typeof screenshots_task_keys];
  context: Context;
}): Promise<boolean> => {
  const hasReferrer = !!context.req.header('referer');

  if (!hasReferrer || currentlyCheckingTags.has(tag)) {
    return false;
  }

  currentlyCheckingTags.add(tag);

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
      currentlyCheckingTags.delete(tag);
    }, CACHE_TAG_EXPIRATION_TIME);
  }
};
