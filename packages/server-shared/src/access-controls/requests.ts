import { z } from 'zod';

// API Request schemas for access control operations

// Asset Permission Requests

export const CreateAssetPermissionRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  identityId: z.string().uuid(),
  identityType: z.enum(['user', 'team', 'organization']),
  role: z.enum(['owner', 'full_access', 'can_edit', 'can_filter', 'can_view']),
});
export type CreateAssetPermissionRequest = z.infer<typeof CreateAssetPermissionRequestSchema>;

export const CreateAssetPermissionByEmailRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  email: z.string().email(),
  role: z.enum(['owner', 'full_access', 'can_edit', 'can_filter', 'can_view']),
});
export type CreateAssetPermissionByEmailRequest = z.infer<
  typeof CreateAssetPermissionByEmailRequestSchema
>;

export const ListAssetPermissionsRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  identityType: z.enum(['user', 'team', 'organization']).optional(),
});
export type ListAssetPermissionsRequest = z.infer<typeof ListAssetPermissionsRequestSchema>;

export const RemoveAssetPermissionRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  identityId: z.string().uuid(),
  identityType: z.enum(['user', 'team', 'organization']),
});
export type RemoveAssetPermissionRequest = z.infer<typeof RemoveAssetPermissionRequestSchema>;

export const RemoveAssetPermissionByEmailRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  email: z.string().email(),
});
export type RemoveAssetPermissionByEmailRequest = z.infer<
  typeof RemoveAssetPermissionByEmailRequestSchema
>;

export const CheckAssetPermissionRequestSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  userId: z.string().uuid(),
  requiredRole: z.enum(['owner', 'full_access', 'can_edit', 'can_filter', 'can_view']),
});
export type CheckAssetPermissionRequest = z.infer<typeof CheckAssetPermissionRequestSchema>;

// Dataset Permission Requests

export const GetPermissionedDatasetsRequestSchema = z.object({
  page: z.number().int().min(0).default(0),
  pageSize: z.number().int().min(1).max(100).default(20),
});
export type GetPermissionedDatasetsRequest = z.infer<typeof GetPermissionedDatasetsRequestSchema>;

export const CheckDatasetAccessRequestSchema = z.object({
  datasetId: z.string().uuid(),
});
export type CheckDatasetAccessRequest = z.infer<typeof CheckDatasetAccessRequestSchema>;

export const CheckMultipleDatasetsAccessRequestSchema = z.object({
  datasetIds: z.array(z.string().uuid()).min(1).max(100),
});
export type CheckMultipleDatasetsAccessRequest = z.infer<
  typeof CheckMultipleDatasetsAccessRequestSchema
>;

// User Lookup Requests

export const FindUserByEmailRequestSchema = z.object({
  email: z.string().email(),
  createIfNotExists: z.boolean().default(false),
  organizationId: z.string().uuid().optional(),
});
export type FindUserByEmailRequest = z.infer<typeof FindUserByEmailRequestSchema>;

export const SearchUsersRequestSchema = z.object({
  query: z.string().min(1),
  organizationId: z.string().uuid().optional(),
  includeTeams: z.boolean().default(false),
  limit: z.number().int().min(1).max(50).default(10),
});
export type SearchUsersRequest = z.infer<typeof SearchUsersRequestSchema>;
