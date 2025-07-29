import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { chats, messages, messagesToFiles } from '../../schema';

export async function checkChatsContainingAsset(
  assetId: string,
  _assetType: 'metric' | 'dashboard'
): Promise<{ id: string }[]> {
  const result = await db
    .selectDistinct({
      id: chats.id,
    })
    .from(messagesToFiles)
    .innerJoin(messages, eq(messages.id, messagesToFiles.messageId))
    .innerJoin(chats, eq(chats.id, messages.chatId))
    .where(
      and(
        eq(messagesToFiles.fileId, assetId),
        isNull(messagesToFiles.deletedAt),
        isNull(messages.deletedAt),
        isNull(chats.deletedAt)
      )
    );

  return result;
}
