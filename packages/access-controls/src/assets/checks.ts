import {
  type CheckAssetPermissionParams,
  checkAssetPermission as checkDbAssetPermission,
  getUserOrganizationsByUserId,
} from '@buster/database/queries';
import type { User } from '@buster/database/queries';
import type { AssetType } from '@buster/database/schema-types';
import type { AssetPermissionRole, OrganizationMembership, WorkspaceSharing } from '../types';
import { getHighestPermission, isPermissionSufficient } from '../types/asset-permissions';
import { getCachedPermission, setCachedPermission } from './cache';
import { checkCascadingPermissions } from './cascading-permissions';
import { hasPublicAccess } from './public-access-check';

export interface AssetPermissionCheck {
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
}

export interface AssetPermissionResult {
  hasAccess: boolean;
  effectiveRole?: AssetPermissionRole;
  accessPath?: 'direct' | 'workspace_sharing' | 'cascading' | 'admin' | 'public';
}

/**
 * Check if a user has sufficient permission to perform an action on an asset
 */
export async function checkPermission(check: AssetPermissionCheck): Promise<AssetPermissionResult> {
  const {
    userId,
    assetId,
    assetType,
    requiredRole,
    organizationId,
    workspaceSharing,
    publiclyAccessible,
    publicExpiryDate,
    publicPassword,
    userSuppliedPassword,
  } = check;

  // Check cache first (only for single role checks)
  const cached = getCachedPermission(userId, assetId, assetType, requiredRole);
  if (cached !== undefined) {
    return cached;
  }

  // Get user's organization memberships
  const userOrgs = await getUserOrganizationsByUserId(userId);
  const orgMemberships: OrganizationMembership[] = userOrgs.map((org) => ({
    id: org.organizationId,
    role: org.role,
  }));

  // Check database permissions (includes admin check)
  const dbParams: CheckAssetPermissionParams = {
    userId,
    assetId,
    assetType,
  };
  if (organizationId !== undefined) {
    dbParams.organizationId = organizationId;
  }
  const dbResult = await checkDbAssetPermission(dbParams);

  if (dbResult.hasAccess && dbResult.role) {
    // Check if the role is sufficient
    if (isPermissionSufficient(dbResult.role, requiredRole)) {
      const result: AssetPermissionResult = {
        hasAccess: true,
        effectiveRole: dbResult.role,
      };
      if (dbResult.accessPath !== undefined) {
        result.accessPath = dbResult.accessPath;
      }
      // Only cache single role checks
      if (!Array.isArray(requiredRole)) {
        setCachedPermission(userId, assetId, assetType, requiredRole, result);
      }
      return result;
    }
  }

  // Check workspace sharing if provided
  if (workspaceSharing && workspaceSharing !== 'none' && organizationId) {
    const isOrgMember = orgMemberships.some((org) => org.id === organizationId);

    if (isOrgMember) {
      const workspaceRole = mapWorkspaceSharingToRole(workspaceSharing);
      if (workspaceRole && isPermissionSufficient(workspaceRole, requiredRole)) {
        const result = {
          hasAccess: true,
          effectiveRole: workspaceRole,
          accessPath: 'workspace_sharing' as const,
        };
        // Only cache single role checks
        if (!Array.isArray(requiredRole)) {
          setCachedPermission(userId, assetId, assetType, requiredRole, result);
        }
        return result;
      }
    }
  }

  console.info('publiclyAccessible', publiclyAccessible);

  if (publiclyAccessible) {
    const hasPublicAccessCheck = hasPublicAccess(
      publiclyAccessible,
      publicExpiryDate,
      publicPassword,
      userSuppliedPassword
    );
    if (hasPublicAccessCheck) {
      const accessRole: AssetPermissionRole = 'can_view';
      if (isPermissionSufficient(accessRole, requiredRole)) {
        const result = {
          hasAccess: true,
          effectiveRole: accessRole,
          accessPath: 'public' as const,
        };
        setCachedPermission(userId, assetId, assetType, requiredRole, result);
        return result;
      }
    }
  }

  // Check cascading permissions for specific asset types
  if (requiredRole === 'can_view') {
    // Create a user object for cascading permissions check
    const user: Pick<User, 'id'> = { id: userId };
    const hasCascadingAccess = await checkCascadingPermissions(
      assetId,
      assetType,
      user as User,
      userSuppliedPassword
    );
    if (hasCascadingAccess) {
      const result = {
        hasAccess: true,
        effectiveRole: 'can_view' as AssetPermissionRole,
        accessPath: 'cascading' as const,
      };
      setCachedPermission(userId, assetId, assetType, requiredRole, result);
      return result;
    }
  }

  const result = { hasAccess: false };
  // Only cache single role checks
  if (!Array.isArray(requiredRole)) {
    setCachedPermission(userId, assetId, assetType, requiredRole, result);
  }
  return result;
}

/**
 * Compute the effective permission level for a user on an asset
 * Takes the highest permission from direct, workspace sharing, and admin roles
 */
export function computeEffectivePermission(
  directRole: AssetPermissionRole | null,
  workspaceSharing: WorkspaceSharing,
  organizationId: string,
  userOrgs: OrganizationMembership[]
): AssetPermissionRole | null {
  const roles: (AssetPermissionRole | null)[] = [];

  // Check admin roles
  const orgMembership = userOrgs.find((org) => org.id === organizationId);
  if (orgMembership) {
    if (orgMembership.role === 'workspace_admin' || orgMembership.role === 'data_admin') {
      return 'owner'; // Admins get owner access
    }
  }

  // Add direct role
  if (directRole) {
    roles.push(directRole);
  }

  // Add workspace sharing role
  if (workspaceSharing !== 'none' && orgMembership) {
    const workspaceRole = mapWorkspaceSharingToRole(workspaceSharing);
    if (workspaceRole) {
      roles.push(workspaceRole);
    }
  }

  return getHighestPermission(roles);
}

/**
 * Map workspace sharing level to permission role
 */
function mapWorkspaceSharingToRole(workspaceSharing: WorkspaceSharing): AssetPermissionRole | null {
  switch (workspaceSharing) {
    case 'can_view':
      return 'can_view';
    case 'can_edit':
      return 'can_edit';
    case 'full_access':
      return 'full_access';
    case 'none':
      return null;
    default:
      return null;
  }
}
