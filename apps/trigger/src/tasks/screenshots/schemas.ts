import { GetMetricScreenshotHandlerArgsSchema } from '@buster/server-shared/screenshots';
import { z } from 'zod';

export const TakeMetricScreenshotTriggerSchema = GetMetricScreenshotHandlerArgsSchema.extend({
  isOnSaveEvent: z.boolean(),
  metricId: z.string(),
});

export type TakeMetricScreenshotTrigger = z.infer<typeof TakeMetricScreenshotTriggerSchema>;
