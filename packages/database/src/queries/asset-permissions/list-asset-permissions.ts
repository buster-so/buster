import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../connection';
import { assetPermissions, users } from '../../schema';
import type { AssetType, IdentityType } from '../../schema-types';

type AssetPermission = InferSelectModel<typeof assetPermissions>;
type User = InferSelectModel<typeof users>;

export interface ListAssetPermissionsParams {
  assetId: string;
  assetType: AssetType;
  identityType?: IdentityType;
}

export interface AssetPermissionWithUser {
  permission: AssetPermission;
  user: User | null;
}

/**
 * Lists all permissions for a given asset
 * Includes user information for user-type permissions
 */
export async function listAssetPermissions(
  params: ListAssetPermissionsParams
): Promise<AssetPermissionWithUser[]> {
  const { assetId, assetType, identityType } = params;

  // Build where conditions
  const whereConditions = [
    eq(assetPermissions.assetId, assetId),
    eq(assetPermissions.assetType, assetType),
    isNull(assetPermissions.deletedAt),
  ];

  if (identityType) {
    whereConditions.push(eq(assetPermissions.identityType, identityType));
  }

  // Get permissions with optional user join
  const permissions = await db
    .select({
      permission: assetPermissions,
      user: users,
    })
    .from(assetPermissions)
    .leftJoin(
      users,
      and(eq(assetPermissions.identityId, users.id), eq(assetPermissions.identityType, 'user'))
    )
    .where(and(...whereConditions));

  return permissions.map((row) => ({
    permission: row.permission,
    user: row.user,
  }));
}

/**
 * Get all permissions for a specific user on a specific asset
 */
export async function getUserAssetPermission(
  userId: string,
  assetId: string,
  assetType: AssetType
): Promise<AssetPermission | null> {
  const [permission] = await db
    .select()
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .limit(1);

  return permission || null;
}

/**
 * Get all assets of a specific type that a user has permissions for
 */
export async function getUserAssetsByType(
  userId: string,
  assetType: AssetType
): Promise<AssetPermission[]> {
  return await db
    .select()
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        eq(assetPermissions.assetType, assetType),
        isNull(assetPermissions.deletedAt)
      )
    );
}

/**
 * Get all permissions for a user across all assets
 */
export async function getAllUserPermissions(userId: string): Promise<AssetPermission[]> {
  return await db
    .select()
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, userId),
        eq(assetPermissions.identityType, 'user'),
        isNull(assetPermissions.deletedAt)
      )
    );
}

/**
 * Count permissions for an asset
 */
export async function countAssetPermissions(
  assetId: string,
  assetType: AssetType
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType),
        isNull(assetPermissions.deletedAt)
      )
    );

  return result[0]?.count ?? 0;
}
