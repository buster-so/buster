import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { assetPermissions } from '../../schema';
import type { AssetType, IdentityType } from '../../schema-types';

type AssetPermission = InferSelectModel<typeof assetPermissions>;

export interface RemoveAssetPermissionParams {
  identityId: string;
  identityType: IdentityType;
  assetId: string;
  assetType: AssetType;
  updatedBy: string;
}

/**
 * Soft deletes an asset permission
 * Returns the deleted permission or null if not found
 */
export async function removeAssetPermission(
  params: RemoveAssetPermissionParams
): Promise<AssetPermission | null> {
  const { identityId, identityType, assetId, assetType, updatedBy } = params;
  const now = new Date().toISOString();

  const [deleted] = await db
    .update(assetPermissions)
    .set({
      deletedAt: now,
      updatedAt: now,
      updatedBy,
    })
    .where(
      and(
        eq(assetPermissions.identityId, identityId),
        eq(assetPermissions.identityType, identityType),
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType),
        isNull(assetPermissions.deletedAt) // Only delete if not already deleted
      )
    )
    .returning();

  return deleted || null;
}

export interface BulkRemoveAssetPermissionsParams {
  assetId: string;
  assetType: AssetType;
  identityIds: string[];
  identityType: IdentityType;
  updatedBy: string;
}

/**
 * Soft deletes multiple asset permissions for the same asset
 */
export async function bulkRemoveAssetPermissions(
  params: BulkRemoveAssetPermissionsParams
): Promise<AssetPermission[]> {
  const { assetId, assetType, identityIds, identityType, updatedBy } = params;

  if (identityIds.length === 0) {
    return [];
  }

  const now = new Date().toISOString();

  const deleted = await db
    .update(assetPermissions)
    .set({
      deletedAt: now,
      updatedAt: now,
      updatedBy,
    })
    .where(
      and(
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType),
        eq(assetPermissions.identityType, identityType),
        inArray(assetPermissions.identityId, identityIds),
        isNull(assetPermissions.deletedAt)
      )
    )
    .returning();

  return deleted;
}

/**
 * Remove all permissions for a specific asset
 * Used when deleting an asset
 */
export async function removeAllAssetPermissions(
  assetId: string,
  assetType: AssetType,
  updatedBy: string
): Promise<number> {
  const now = new Date().toISOString();

  const deleted = await db
    .update(assetPermissions)
    .set({
      deletedAt: now,
      updatedAt: now,
      updatedBy,
    })
    .where(
      and(
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .returning();

  return deleted.length;
}

/**
 * Remove all permissions for a specific identity
 * Used when removing a user/team/org from the system
 */
export async function removeAllIdentityPermissions(
  identityId: string,
  identityType: IdentityType,
  updatedBy: string
): Promise<number> {
  const now = new Date().toISOString();

  const deleted = await db
    .update(assetPermissions)
    .set({
      deletedAt: now,
      updatedAt: now,
      updatedBy,
    })
    .where(
      and(
        eq(assetPermissions.identityId, identityId),
        eq(assetPermissions.identityType, identityType),
        isNull(assetPermissions.deletedAt)
      )
    )
    .returning();

  return deleted.length;
}
