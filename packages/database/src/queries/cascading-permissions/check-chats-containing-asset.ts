import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { chats, messages, messagesToFiles } from '../../schema';
import type { WorkspaceSharing } from '../../schema-types';

export interface ChatWithSharing {
  id: string;
  organizationId: string;
  workspaceSharing: WorkspaceSharing | null;
  publiclyAccessible: boolean;
  publicExpiryDate: string | null;
  publicPassword: string | null;
}

export async function checkChatsContainingAsset(
  assetId: string,
  _assetType: 'metric_file' | 'dashboard_file' | 'report_file'
): Promise<ChatWithSharing[]> {
  const result = await db
    .selectDistinct({
      id: chats.id,
      organizationId: chats.organizationId,
      workspaceSharing: chats.workspaceSharing,
      publiclyAccessible: chats.publiclyAccessible,
      publicExpiryDate: chats.publicExpiryDate,
      publicPassword: chats.publicPassword,
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
