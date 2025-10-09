import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { metricFiles } from '../../schema';

export const hasMetricScreenshotBeenTakenWithin = async (
  metricId: string,
  afterDate: Date | Dayjs
): Promise<boolean> => {
  const [metric] = await db
    .select()
    .from(metricFiles)
    .where(and(eq(metricFiles.id, metricId), isNull(metricFiles.deletedAt)));

  if (!metric || !metric.screenshotTakenAt) {
    return false;
  }

  return dayjs(metric.screenshotTakenAt).isAfter(dayjs(afterDate));
};
