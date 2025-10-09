import {
  bulkCreateAssetPermissions,
  createAssetPermission,
  findUserByEmail,
  type ListAssetPermissionsParams,
  listAssetPermissions,
  type RemoveAssetPermissionParams,
  removeAssetPermission,
} from '@buster/database/queries';
import type { AssetType } from '@buster/database/schema-types';
// TODO: Import createUser when implemented in database package
import type {
  AssetPermission,
  AssetPermissionRole,
  AssetPermissionWithUser,
  IdentityType,
  WorkspaceSharing,
} from '../types/asset-permissions';
import { AccessControlError } from '../types/errors';
import { invalidateOnPermissionChange } from './cache';

/**
 * Create or update an asset permission
 */
export async function createPermission(params: {
  assetId: string;
  assetType: AssetType;
  identityId: string;
  identityType: IdentityType;
  role: AssetPermissionRole;
  createdBy: string;
}): Promise<AssetPermission> {
  try {
    const permission = await createAssetPermission({
      identityId: params.identityId,
      identityType: params.identityType,
      assetId: params.assetId,
      assetType: params.assetType,
      role: params.role,
      createdBy: params.createdBy,
    });

    // Invalidate cache
    invalidateOnPermissionChange(
      params.identityId,
      params.identityType,
      params.assetId,
      params.assetType
    );

    return permission;
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to create asset permission', { error });
  }
}

/**
 * Create permission by email address
 * Will create user if they don't exist
 */
export async function createPermissionByEmail(params: {
  assetId: string;
  assetType: AssetType;
  email: string;
  role: AssetPermissionRole;
  createdBy: string;
}): Promise<AssetPermission> {
  const { email, assetId, assetType, role, createdBy } = params;

  // Validate email format
  if (!email.includes('@')) {
    throw new AccessControlError('invalid_email', `Invalid email address: ${email}`);
  }

  // Find or create user
  const user = await findUserByEmail(email);

  if (!user) {
    // TODO: Implement user creation when createUser is available
    throw new AccessControlError(
      'not_implemented',
      'User creation not yet implemented - createUser function needs to be added to database package'
    );
  }

  // Create permission for the user
  return createPermission({
    assetId,
    assetType,
    identityId: user.id,
    identityType: 'user',
    role,
    createdBy,
  });
}

/**
 * List all permissions for an asset
 */
export async function listPermissions(
  params: ListAssetPermissionsParams
): Promise<AssetPermissionWithUser[]> {
  try {
    const permissions = await listAssetPermissions(params);
    return permissions;
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to list asset permissions', { error });
  }
}

/**
 * Remove a permission
 */
export async function removePermission(params: RemoveAssetPermissionParams): Promise<boolean> {
  try {
    const removed = await removeAssetPermission(params);

    if (removed !== null) {
      // Invalidate cache
      invalidateOnPermissionChange(
        params.identityId,
        params.identityType,
        params.assetId,
        params.assetType
      );
    }

    return removed !== null;
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to remove asset permission', { error });
  }
}

/**
 * Remove permission by email
 */
export async function removePermissionByEmail(params: {
  assetId: string;
  assetType: AssetType;
  email: string;
  updatedBy: string;
}): Promise<boolean> {
  const { email, assetId, assetType, updatedBy } = params;

  // Validate email format
  if (!email.includes('@')) {
    throw new AccessControlError('invalid_email', `Invalid email address: ${email}`);
  }

  // Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AccessControlError('user_not_found', `User not found: ${email}`);
  }

  // Remove permission
  return removePermission({
    identityId: user.id,
    identityType: 'user',
    assetId,
    assetType,
    updatedBy,
  });
}

/**
 * Bulk create permissions
 */
export async function bulkCreatePermissions(params: {
  permissions: Array<{
    assetId: string;
    assetType: AssetType;
    identityId: string;
    identityType: IdentityType;
    role: AssetPermissionRole;
  }>;
  createdBy: string;
}): Promise<AssetPermission[]> {
  const { permissions, createdBy } = params;

  // All remaining asset types are valid

  try {
    const created = await bulkCreateAssetPermissions({
      permissions: permissions.map((p) => ({
        ...p,
        createdBy,
      })),
    });

    return created;
  } catch (error) {
    throw new AccessControlError('database_error', 'Failed to bulk create asset permissions', {
      error,
    });
  }
}

/**
 * Check if a user has a specific permission on an asset
 * This is a convenience wrapper around checkPermission from checks.ts
 */
export async function hasAssetPermission(params: {
  userId: string;
  assetId: string;
  assetType: AssetType;
  requiredRole: AssetPermissionRole;
  organizationId?: string;
  workspaceSharing?: WorkspaceSharing;
  publiclyAccessible?: boolean;
  publicExpiryDate?: string | undefined;
  publicPassword?: string | undefined;
  userSuppliedPassword?: string | undefined;
}): Promise<boolean> {
  const { checkPermission } = await import('./checks');

  const result = await checkPermission(params);
  return result.hasAccess;
}
