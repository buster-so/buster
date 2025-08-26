import {
  and,
  assetPermissions,
  assetTypeEnum,
  chats,
  collectionsToAssets,
  db as database,
  eq,
  identityTypeEnum,
  isNull,
  usersToOrganizations,
} from '@buster/database';
import { z } from 'zod';

// Input validation schema
const CanUserAccessChatSchema = z.object({
  userId: z.string().uuid(),
  chatId: z.string().uuid(),
});

export const canUserAccessChat = async ({
  userId,
  chatId,
}: {
  userId: string;
  chatId: string;
}): Promise<boolean> => {
  // Validate inputs
  const input = CanUserAccessChatSchema.parse({ userId, chatId });

  // Run all permission checks concurrently for optimal performance
  const [directPermission, collectionPermission, chatInfo, userOrgs] = await Promise.all([
    // Check 1: Direct user permission on chat
    checkDirectChatPermission(database, input.userId, input.chatId),

    // Check 2: User permission through collections
    checkCollectionChatPermission(database, input.userId, input.chatId),

    // Check 3: Get chat info (creator & organization)
    getChatInfo(database, input.chatId),

    // Check 4: Get user's organizations and roles
    getUserOrganizations(database, input.userId),
  ]);

  // If chat doesn't exist or is deleted, deny access
  if (!chatInfo) {
    return false;
  }

  // Check 1: Direct permission exists
  if (directPermission) {
    return true;
  }

  // Check 2: Collection permission exists
  if (collectionPermission) {
    return true;
  }

  // Check 3: User is the creator
  if (chatInfo.createdBy === input.userId) {
    return true;
  }

  // Check 4: User is workspace_admin or data_admin in the chat's organization
  const isOrgAdmin = userOrgs.some(
    (org) =>
      org.organizationId === chatInfo.organizationId &&
      (org.role === 'workspace_admin' || org.role === 'data_admin')
  );

  return isOrgAdmin;
};

// Helper function to check direct chat permission
async function checkDirectChatPermission(
  db: typeof database,
  userId: string,
  chatId: string
): Promise<boolean> {
  const result = await db
    .select({ id: assetPermissions.assetId })
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.assetId, chatId),
        eq(assetPermissions.assetType, 'chat'),
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        isNull(assetPermissions.deletedAt)
      )
    )
    .limit(1);

  return result.length > 0;
}

// Helper function to check collection-based chat permission
async function checkCollectionChatPermission(
  db: typeof database,
  userId: string,
  chatId: string
): Promise<boolean> {
  const result = await db
    .selectDistinct({ collectionId: collectionsToAssets.collectionId })
    .from(collectionsToAssets)
    .innerJoin(
      assetPermissions,
      and(
        eq(assetPermissions.assetId, collectionsToAssets.collectionId),
        eq(assetPermissions.assetType, 'collection'),
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        isNull(assetPermissions.deletedAt)
      )
    )
    .where(
      and(
        eq(collectionsToAssets.assetId, chatId),
        eq(collectionsToAssets.assetType, 'chat'),
        isNull(collectionsToAssets.deletedAt)
      )
    )
    .limit(1);

  return result.length > 0;
}

// Helper function to get chat info (creator and organization)
async function getChatInfo(
  db: typeof database,
  chatId: string
): Promise<{ createdBy: string; organizationId: string } | null> {
  const result = await db
    .select({
      createdBy: chats.createdBy,
      organizationId: chats.organizationId,
    })
    .from(chats)
    .where(and(eq(chats.id, chatId), isNull(chats.deletedAt)))
    .limit(1);

  return result[0] || null;
}

// Helper function to get user's organizations and roles
async function getUserOrganizations(
  db: typeof database,
  userId: string
): Promise<Array<{ organizationId: string; role: string }>> {
  const result = await db
    .select({
      organizationId: usersToOrganizations.organizationId,
      role: usersToOrganizations.role,
    })
    .from(usersToOrganizations)
    .where(and(eq(usersToOrganizations.userId, userId), isNull(usersToOrganizations.deletedAt)));

  return result;
}
