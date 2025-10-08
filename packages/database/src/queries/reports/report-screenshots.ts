import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { reportFiles } from '../../schema';

export const hasReportScreenshotBeenTakenWithin = async (
  reportId: string,
  afterDate: Date | Dayjs
): Promise<boolean> => {
  const [report] = await db
    .select()
    .from(reportFiles)
    .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)));

  if (!report || !report.screenshotTakenAt) {
    return false;
  }

  return dayjs(report.screenshotTakenAt).isAfter(dayjs(afterDate));
};
