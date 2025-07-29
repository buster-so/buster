import { z } from 'zod';

// Internal types for asset permissions

// Identity types for permissions
export const IdentityTypeSchema = z.enum(['user', 'team', 'organization']);
export type IdentityType = z.infer<typeof IdentityTypeSchema>;

// Asset types - matching the database schema
export const AssetTypeSchema = z.enum([
  'dashboard',
  'thread',
  'collection',
  'chat',
  'metric_file',
  'dashboard_file',
  'data_source',
  'metric',
  'filter',
  'dataset',
  'tool',
  'source',
  'collection_file',
  'dataset_permission',
]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

// Types that support cascading permissions
export type CascadingAssetType =
  | 'metric'
  | 'dashboard'
  | 'chat'
  | 'metric_file'
  | 'dashboard_file'
  | 'collection';

// Permission roles - matching database AssetPermissionRole enum
export const AssetPermissionRoleSchema = z.enum([
  'owner',
  'viewer',
  'full_access',
  'can_edit',
  'can_filter',
  'can_view',
]);
export type AssetPermissionRole = z.infer<typeof AssetPermissionRoleSchema>;

// Workspace sharing levels - matching Rust WorkspaceSharing enum
export const WorkspaceSharingSchema = z.enum(['none', 'can_view', 'can_edit', 'full_access']);
export type WorkspaceSharing = z.infer<typeof WorkspaceSharingSchema>;

// Internal asset permission record (matches database schema)
export interface AssetPermission {
  identityId: string;
  identityType: IdentityType;
  assetId: string;
  assetType: AssetType;
  role: AssetPermissionRole;
  createdAt: string; // ISO string from database
  updatedAt: string; // ISO string from database
  deletedAt: string | null; // ISO string from database
  createdBy: string;
  updatedBy: string;
}

// User info for permission listings
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

// Asset permission with user info
export interface AssetPermissionWithUser {
  permission: AssetPermission;
  user: UserInfo | null; // null for non-user identities (teams, orgs)
}

// Permission level comparison helper
export const permissionLevelOrder = {
  owner: 6,
  full_access: 5,
  can_edit: 4,
  viewer: 3, // viewer has full read access
  can_filter: 2,
  can_view: 1,
} as const;

export function isPermissionSufficient(
  userRole: AssetPermissionRole | null,
  requiredRole: AssetPermissionRole
): boolean {
  if (!userRole) return false;
  return permissionLevelOrder[userRole] >= permissionLevelOrder[requiredRole];
}

export function getHighestPermission(
  roles: (AssetPermissionRole | null)[]
): AssetPermissionRole | null {
  const validRoles = roles.filter((r): r is AssetPermissionRole => r !== null);
  if (validRoles.length === 0) return null;

  return validRoles.reduce((highest, current) => {
    return permissionLevelOrder[current] > permissionLevelOrder[highest] ? current : highest;
  });
}

// Update field pattern (matching Rust)
export type UpdateField<T> = T | null | undefined;

/**
 * Check if an UpdateField represents a change (either SetNull or Update)
 */
export function isFieldUpdate<T>(field: UpdateField<T>): boolean {
  return field !== undefined;
}

/**
 * Build a database update object from fields with UpdateField pattern
 */
export function buildUpdateObject<T extends Record<string, unknown>>(updates: T): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}
