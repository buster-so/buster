import { and, desc, eq, exists, isNull, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import {
  assetPermissions,
  collections,
  users,
} from '../../schema';
import type { CollectionListItem, InfinitePaginatedResponse } from '../../schema-types';
import { PaginationInputSchema } from '../../schema-types';

export const ListCollectionsRequestSchema = z
  .object({
    userId: z.string().uuid('User ID must be a valid UUID'),
    organizationId: z.string().uuid('Organization ID must be a valid UUID'),
    shared_with_me: z.boolean().optional(),
    owned_by_me: z.boolean().optional(),
  })
  .merge(PaginationInputSchema);

export type ListCollectionsRequest = z.infer<typeof ListCollectionsRequestSchema>;
export type ListCollectionsResponse = InfinitePaginatedResponse<CollectionListItem>;

/**
 * List collections with pagination support
 *
 * This function efficiently retrieves a list of collections with their associated user information
 * and sharing details. It supports filtering by ownership and shared status.
 *
 * @param params - Request parameters including userId, organizationId, pagination, and filters
 * @returns Paginated list of collections with user information
 */
export async function listCollections(
  params: ListCollectionsRequest
): Promise<ListCollectionsResponse> {
  const { userId, organizationId, page, page_size, shared_with_me, owned_by_me } =
    ListCollectionsRequestSchema.parse(params);

  // Calculate offset based on page number
  const offset = (page - 1) * page_size;
  const limit = page_size + 1;
  let hasMore = false;

  // Build filter conditions based on request parameters
  const permissionedFilterCondition = or(
    ne(collections.workspaceSharing, 'none'),
    exists(
      db
        .select({ value: sql`1` })
        .from(assetPermissions)
        .where(
          and(
            eq(assetPermissions.assetId, collections.id),
            eq(assetPermissions.assetType, 'collection'),
            eq(assetPermissions.identityId, userId),
            eq(assetPermissions.identityType, 'user'),
            isNull(assetPermissions.deletedAt)
          )
        )
    )
  );

  const allFilterConditions = [
    isNull(collections.deletedAt),
    eq(collections.organizationId, organizationId),
    permissionedFilterCondition
  ];

  if (shared_with_me) {
    allFilterConditions.push(ne(collections.createdBy, userId));
  }
  if (owned_by_me) {
    allFilterConditions.push(eq(collections.createdBy, userId));
  }

  // Main query: join collections with accessible IDs and apply filtering
  const results = await db
    .select({
      id: collections.id,
      name: collections.name,
      description: collections.description,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      createdBy: collections.createdBy,
      organizationId: collections.organizationId,
      workspaceSharing: collections.workspaceSharing,
      userName: users.name,
      userEmail: users.email,
      userAvatarUrl: users.avatarUrl,
    })
    .from(collections)
    .innerJoin(users, eq(collections.createdBy, users.id))
    .where(and(...allFilterConditions))
    .orderBy(desc(collections.updatedAt))
    .limit(limit)
    .offset(offset);

    if (results.length > page_size) {
      hasMore = true;
      results.pop();
    }

  // Transform results to CollectionListItem format
  const collectionItems: CollectionListItem[] = results.map(
    (collection) =>
      ({
        id: collection.id,
        name: collection.name,
        description: collection.description || '',
        updated_at: collection.updatedAt,
        created_at: collection.createdAt,
        created_by: collection.createdBy,
        created_by_name: collection.userName,
        created_by_email: collection.userEmail,
        created_by_avatar_url: collection.userAvatarUrl,
        is_shared: collection.createdBy !== userId,
      })
  );

  return {
    data: collectionItems,
    pagination: {
      page,
      page_size,
      has_more: hasMore
    },
  };
}