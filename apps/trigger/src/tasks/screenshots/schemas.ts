import {
  GetChatScreenshotHandlerArgsSchema,
  GetDashboardScreenshotHandlerArgsSchema,
  GetMetricScreenshotHandlerArgsSchema,
  GetReportScreenshotHandlerArgsSchema,
} from '@buster/server-shared/screenshots';
import { z } from 'zod';

export const TakeMetricScreenshotTriggerSchema = GetMetricScreenshotHandlerArgsSchema.extend({
  isOnSaveEvent: z.boolean(),
  metricId: z.string(),
});

export type TakeMetricScreenshotTrigger = z.infer<typeof TakeMetricScreenshotTriggerSchema>;

export const TakeDashboardScreenshotTriggerSchema = GetDashboardScreenshotHandlerArgsSchema.extend({
  isOnSaveEvent: z.boolean(),
  dashboardId: z.string(),
});

export type TakeDashboardScreenshotTrigger = z.infer<typeof TakeDashboardScreenshotTriggerSchema>;

export const TakeReportScreenshotTriggerSchema = GetReportScreenshotHandlerArgsSchema.extend({
  reportId: z.string(),
});

export type TakeReportScreenshotTrigger = z.infer<typeof TakeReportScreenshotTriggerSchema>;

export const TakeChartScreenshotTriggerSchema = GetChatScreenshotHandlerArgsSchema.extend({
  chartId: z.string(),
});

export type TakeChartScreenshotTrigger = z.infer<typeof TakeChartScreenshotTriggerSchema>;
