import type { schemaTask } from '@trigger.dev/sdk';

export const commonTriggerScreenshotConfig: Partial<Parameters<typeof schemaTask>[0]> = {
  maxDuration: 60 * 1, // 1 minute max
  retry: {
    maxAttempts: 0,
    minTimeoutInMs: 1000, // 1 second
    maxTimeoutInMs: 40 * 1000, // 40 seconds
  },
};
