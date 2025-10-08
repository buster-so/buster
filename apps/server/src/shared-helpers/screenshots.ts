import type { screenshots_task_keys } from '@buster-app/trigger/task-keys';
import { runs } from '@trigger.dev/sdk';
import type { Context } from 'hono';

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

  if (!hasReferrer) {
    return false;
  }

  const lastTask = await runs
    .list({
      status: ['EXECUTING', 'QUEUED'],
      taskIdentifier: key,
      tag,
      limit: 1,
    })
    .then((res) => res.data[0]);

  return !lastTask;
};
