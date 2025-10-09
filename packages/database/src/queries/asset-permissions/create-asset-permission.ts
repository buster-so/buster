import type { InferSelectModel } from 'drizzle-orm';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../connection';
import { assetPermissions } from '../../schema';
import type { AssetPermissionRole, AssetType, IdentityType } from '../../schema-types';

type AssetPermission = InferSelectModel<typeof assetPermissions>;

export interface CreateAssetPermissionParams {
  identityId: string;
  identityType: IdentityType;
  assetId: string;
  assetType: AssetType;
  role: AssetPermissionRole;
  createdBy: string;
}

/**
 * Creates a new asset permission or updates existing one (upsert)
 * Implements soft delete recovery - if a deleted permission exists, it will be restored
 */
export async function createAssetPermission(
  params: CreateAssetPermissionParams
): Promise<AssetPermission> {
  const { identityId, identityType, assetId, assetType, role, createdBy } = params;
  const now = new Date().toISOString();

  // Check if permission already exists (including soft deleted)
  const existing = await db
    .select()
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, identityId),
        eq(assetPermissions.identityType, identityType),
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing permission (including restoring soft deleted)
    const [updated] = await db
      .update(assetPermissions)
      .set({
        role,
        updatedAt: now,
        updatedBy: createdBy,
        deletedAt: null, // Restore if it was soft deleted
      })
      .where(
        and(
          eq(assetPermissions.identityId, identityId),
          eq(assetPermissions.identityType, identityType),
          eq(assetPermissions.assetId, assetId),
          eq(assetPermissions.assetType, assetType)
        )
      )
      .returning();

    return updated as AssetPermission;
  }

  // Create new permission
  const [created] = await db
    .insert(assetPermissions)
    .values({
      identityId,
      identityType,
      assetId,
      assetType,
      role,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();

  return created as AssetPermission;
}

export interface BulkCreateAssetPermissionsParams {
  permissions: CreateAssetPermissionParams[];
}

/**
 * Creates multiple asset permissions in a single transaction
 * Uses upsert logic - existing permissions will be updated
 */
export async function bulkCreateAssetPermissions(
  params: BulkCreateAssetPermissionsParams
): Promise<AssetPermission[]> {
  const { permissions } = params;

  if (permissions.length === 0) {
    return [];
  }

  const results = await db.transaction(async (tx) => {
    const createdPermissions: AssetPermission[] = [];

    for (const permission of permissions) {
      const result = await createAssetPermissionInTransaction(tx, permission);
      createdPermissions.push(result);
    }

    return createdPermissions;
  });

  return results;
}

/**
 * Helper function to create permission within a transaction
 */
async function createAssetPermissionInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: CreateAssetPermissionParams
): Promise<AssetPermission> {
  const { identityId, identityType, assetId, assetType, role, createdBy } = params;
  const now = new Date().toISOString();

  // Check if permission already exists
  const existing = await tx
    .select()
    .from(assetPermissions)
    .where(
      and(
        eq(assetPermissions.identityId, identityId),
        eq(assetPermissions.identityType, identityType),
        eq(assetPermissions.assetId, assetId),
        eq(assetPermissions.assetType, assetType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    const [updated] = await tx
      .update(assetPermissions)
      .set({
        role,
        updatedAt: now,
        updatedBy: createdBy,
        deletedAt: null,
      })
      .where(
        and(
          eq(assetPermissions.identityId, identityId),
          eq(assetPermissions.identityType, identityType),
          eq(assetPermissions.assetId, assetId),
          eq(assetPermissions.assetType, assetType)
        )
      )
      .returning();

    return updated as AssetPermission;
  }

  // Create new
  const [created] = await tx
    .insert(assetPermissions)
    .values({
      identityId,
      identityType,
      assetId,
      assetType,
      role,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();

  return created as AssetPermission;
}
