import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { chats } from '../../schema';

export const hasChatScreenshotBeenTakenWithin = async (
  chatId: string,
  afterDate: Date | Dayjs
): Promise<boolean> => {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)));

  if (!chat || !chat.screenshotTakenAt) {
    return false;
  }

  return dayjs(chat.screenshotTakenAt).isAfter(dayjs(afterDate));
};
