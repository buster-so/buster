import { z } from 'zod';
import type { IdentityType } from './asset-permissions';

// Internal types for dataset permissions

// User organization roles
export const UserOrganizationRoleSchema = z.enum([
  'viewer',
  'workspace_admin',
  'data_admin',
  'querier',
  'restricted_querier',
]);
export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;

// Dataset permission types
export const DatasetPermissionTypeSchema = z.enum(['user', 'team']);
export type DatasetPermissionType = z.infer<typeof DatasetPermissionTypeSchema>;

// Permission group (internal)
export interface PermissionGroup {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

// Dataset permission record
export interface DatasetPermission {
  datasetId: string;
  permissionId: string; // Can be user ID or team ID
  permissionType: DatasetPermissionType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

// Permission group to identity mapping
export interface PermissionGroupIdentity {
  permissionGroupId: string;
  identityId: string;
  identityType: IdentityType;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Dataset to permission group mapping
export interface DatasetPermissionGroup {
  datasetId: string;
  permissionGroupId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Permissioned dataset (for listing)
export interface PermissionedDataset {
  id: string;
  name: string;
  ymlContent: string | null;
  dataSourceId: string;
  organizationId: string;
  createdAt: string; // ISO string from database
  updatedAt: string; // ISO string from database
}

// Dataset access path types
export type DatasetAccessPath =
  | 'admin' // User is admin/data admin/querier
  | 'direct_user' // Direct user → dataset permission
  | 'user_group' // User → permission group → dataset
  | 'team_direct' // User → team → dataset permission
  | 'team_group' // User → team → permission group → dataset
  | 'org_default'; // User → org → default permission group → dataset

// Helper functions
export function isAdminAccess(role: UserOrganizationRole | null): boolean {
  return role === 'workspace_admin' || role === 'data_admin' || role === 'querier';
}

// Organization membership for permission checks
export interface OrganizationMembership {
  id: string; // organization ID
  role: UserOrganizationRole;
}
