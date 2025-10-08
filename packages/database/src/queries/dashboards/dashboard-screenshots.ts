import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { dashboardFiles } from '../../schema';

export const hasDashboardScreenshotBeenTakenWithin = async (
  dashboardId: string,
  afterDate: Date | Dayjs
): Promise<boolean> => {
  const [dashboard] = await db
    .select()
    .from(dashboardFiles)
    .where(and(eq(dashboardFiles.id, dashboardId), isNull(dashboardFiles.deletedAt)));

  if (!dashboard || !dashboard.screenshotTakenAt) {
    return false;
  }

  return dayjs(dashboard.screenshotTakenAt).isAfter(dayjs(afterDate));
};
