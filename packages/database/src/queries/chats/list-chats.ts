import { and, count, desc, eq, exists, gt, isNotNull, isNull, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import {
  assetPermissions,
  chats,
  messages,
  userFavorites,
  users,
  usersToOrganizations,
} from '../../schema';
import type { ChatListItem, PaginatedResponse } from '../../schema-types';
import { createPaginatedResponse, PaginationInputSchema } from '../../schema-types';

export const ListChatsRequestSchema = z
  .object({
    userId: z.string().uuid(),
  })
  .merge(PaginationInputSchema);

export type ListChatsResponse = PaginatedResponse<ChatListItem>;
export type ListChatsRequest = z.infer<typeof ListChatsRequestSchema>;

/**
 * Create a subquery for chats the user owns
 */
function getOwnedChats(userId: string) {
  return db
    .select({ chatId: chats.id })
    .from(chats)
    .where(and(eq(chats.createdBy, userId), isNull(chats.deletedAt)));
}

/**
 * Create a subquery for chats directly shared with the user via asset_permissions
 */
function getDirectlySharedChats(userId: string) {
  return db
    .select({ chatId: assetPermissions.assetId })
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        eq(assetPermissions.assetType, 'chat'),
        isNull(assetPermissions.deletedAt)
      )
    );
}

/**
 * Create a subquery for workspace-shared chats where user has contributed or favorited
 */
function getWorkspaceSharedChats(userId: string) {
  return db
    .selectDistinct({ chatId: chats.id })
    .from(chats)
    .innerJoin(usersToOrganizations, eq(chats.organizationId, usersToOrganizations.organizationId))
    .where(
      and(
        eq(usersToOrganizations.userId, userId),
        isNull(usersToOrganizations.deletedAt),
        ne(chats.workspaceSharing, 'none'),
        isNull(chats.deletedAt),
        or(
          // User has contributed (created messages in this chat)
          exists(
            db
              .select()
              .from(messages)
              .where(
                and(
                  eq(messages.chatId, chats.id),
                  eq(messages.createdBy, userId),
                  isNotNull(messages.requestMessage),
                  isNull(messages.deletedAt)
                )
              )
          ),
          // User has favorited this chat
          exists(
            db
              .select()
              .from(userFavorites)
              .where(
                and(
                  eq(userFavorites.userId, userId),
                  eq(userFavorites.assetId, chats.id),
                  eq(userFavorites.assetType, 'chat'),
                  isNull(userFavorites.deletedAt)
                )
              )
          )
        )
      )
    );
}

/**
 * Create a combined subquery for all accessible chat IDs using UNION
 */
function getAccessibleChatIds(userId: string) {
  const ownedChats = getOwnedChats(userId);
  const directlySharedChats = getDirectlySharedChats(userId);
  const workspaceSharedChats = getWorkspaceSharedChats(userId);

  return ownedChats
    .union(directlySharedChats)
    .union(workspaceSharedChats)
    .as('accessible_chat_ids');
}

/**
 * List chats with pagination support
 *
 * This function efficiently retrieves a list of chats with their associated user information.
 * It uses a CTE-style approach with UNION to gather all accessible chats, then applies
 * content filtering and pagination. Only includes chats with meaningful content.
 *
 * Returns a list of chat items with user information and pagination details.
 */
export async function listChats(params: ListChatsRequest): Promise<ListChatsResponse> {
  const { userId, page, page_size } = ListChatsRequestSchema.parse(params);

  // Calculate offset based on page number
  const offset = (page - 1) * page_size;

  // Create the accessible chat IDs subquery (our CTE equivalent)
  const accessibleChatIds = getAccessibleChatIds(userId);

  // Where conditions for filtering chats
  const contentFilterConditions = and(
    eq(chats.chatType, 'analyst'),
    isNull(chats.deletedAt),
    ne(chats.title, ''),
    or(
      // Has at least one message with a request_message
      exists(
        db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.chatId, chats.id),
              isNotNull(messages.requestMessage),
              ne(messages.requestMessage, ''),
              isNull(messages.deletedAt)
            )
          )
      ),
      // Has more than 1 message
      gt(
        db
          .select({ count: count() })
          .from(messages)
          .where(and(eq(messages.chatId, chats.id), isNull(messages.deletedAt))),
        1
      )
    )
  );

  // Main query: join chats with accessible IDs and apply content filtering
  const results = await db
    .select({
      id: chats.id,
      title: chats.title,
      createdAt: chats.createdAt,
      updatedAt: chats.updatedAt,
      createdBy: chats.createdBy,
      mostRecentFileId: chats.mostRecentFileId,
      mostRecentFileType: chats.mostRecentFileType,
      mostRecentVersionNumber: chats.mostRecentVersionNumber,
      organizationId: chats.organizationId,
      workspaceSharing: chats.workspaceSharing,
      updatedBy: chats.updatedBy,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
    })
    .from(chats)
    .innerJoin(accessibleChatIds, eq(chats.id, accessibleChatIds.chatId))
    .innerJoin(users, eq(chats.createdBy, users.id))
    .where(contentFilterConditions)
    .orderBy(desc(chats.updatedAt))
    .limit(page_size)
    .offset(offset);

  // Get total count for pagination using the same conditions
  const [countResult] = await db
    .select({ count: count() })
    .from(chats)
    .innerJoin(accessibleChatIds, eq(chats.id, accessibleChatIds.chatId))
    .where(contentFilterConditions);

  // Transform results to ChatListItem format
  const chatItems: ChatListItem[] = [];

  for (const chat of results) {
    if (chat.title.trim()) {
      chatItems.push({
        id: chat.id,
        name: chat.title,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt,
        created_by: chat.createdBy,
        created_by_id: chat.createdBy,
        created_by_name: chat.userName || chat.userEmail,
        created_by_avatar: chat.userAvatarUrl,
        last_edited: chat.updatedAt,
        latest_file_id: chat.mostRecentFileId,
        latest_file_type: chat.mostRecentFileType as
          | 'metric_file'
          | 'dashboard_file'
          | 'report_file', // TODO: talk to nate about this, it is why we see the console errors
        latest_version_number: chat.mostRecentVersionNumber ?? undefined,
        is_shared: chat.createdBy !== userId,
      });
    }
  }

  // Return paginated response
  return createPaginatedResponse({
    data: chatItems,
    page,
    page_size,
    total: countResult?.count ?? 0,
  });
}
