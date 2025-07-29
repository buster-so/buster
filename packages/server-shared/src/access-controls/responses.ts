import { z } from 'zod';

// API Response schemas for access control operations

// User info response (simplified for API)
export const UserInfoResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
});
export type UserInfoResponse = z.infer<typeof UserInfoResponseSchema>;

// Asset permission response
export const AssetPermissionResponseSchema = z.object({
  identityId: z.string().uuid(),
  identityType: z.enum(['user', 'team', 'organization']),
  assetId: z.string().uuid(),
  assetType: z.enum(['metric_file', 'dashboard_file', 'chat', 'collection']),
  role: z.enum(['owner', 'full_access', 'can_edit', 'can_filter', 'can_view']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type AssetPermissionResponse = z.infer<typeof AssetPermissionResponseSchema>;

// Asset permission with user response
export const AssetPermissionWithUserResponseSchema = z.object({
  permission: AssetPermissionResponseSchema,
  user: UserInfoResponseSchema.nullable(),
});
export type AssetPermissionWithUserResponse = z.infer<typeof AssetPermissionWithUserResponseSchema>;

// List permissions response
export const ListAssetPermissionsResponseSchema = z.object({
  permissions: z.array(AssetPermissionWithUserResponseSchema),
});
export type ListAssetPermissionsResponse = z.infer<typeof ListAssetPermissionsResponseSchema>;

// Check permission response
export const CheckAssetPermissionResponseSchema = z.object({
  hasAccess: z.boolean(),
  effectiveRole: z.enum(['owner', 'full_access', 'can_edit', 'can_filter', 'can_view']).nullable(),
  accessPath: z.enum(['direct', 'workspace_sharing', 'cascading', 'admin']).nullable(),
});
export type CheckAssetPermissionResponse = z.infer<typeof CheckAssetPermissionResponseSchema>;

// Dataset responses

export const PermissionedDatasetResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ymlContent: z.string().nullable(),
  dataSourceId: z.string().uuid(),
  organizationId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PermissionedDatasetResponse = z.infer<typeof PermissionedDatasetResponseSchema>;

export const GetPermissionedDatasetsResponseSchema = z.object({
  datasets: z.array(PermissionedDatasetResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});
export type GetPermissionedDatasetsResponse = z.infer<typeof GetPermissionedDatasetsResponseSchema>;

export const CheckDatasetAccessResponseSchema = z.object({
  hasAccess: z.boolean(),
  accessPath: z
    .enum(['admin', 'direct_user', 'user_group', 'team_direct', 'team_group', 'org_default'])
    .nullable(),
});
export type CheckDatasetAccessResponse = z.infer<typeof CheckDatasetAccessResponseSchema>;

export const CheckMultipleDatasetsAccessResponseSchema = z.object({
  hasAccessToAll: z.boolean(),
  accessDetails: z.record(
    z.string().uuid(),
    z.object({
      hasAccess: z.boolean(),
      accessPath: z
        .enum(['admin', 'direct_user', 'user_group', 'team_direct', 'team_group', 'org_default'])
        .nullable(),
    })
  ),
});
export type CheckMultipleDatasetsAccessResponse = z.infer<
  typeof CheckMultipleDatasetsAccessResponseSchema
>;

// User lookup responses

export const FindUserByEmailResponseSchema = z.object({
  user: UserInfoResponseSchema.nullable(),
  created: z.boolean().default(false),
});
export type FindUserByEmailResponse = z.infer<typeof FindUserByEmailResponseSchema>;

export const SearchResultItemResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['user', 'team']),
  name: z.string(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable(),
  memberCount: z.number().optional(),
});
export type SearchResultItemResponse = z.infer<typeof SearchResultItemResponseSchema>;

export const SearchUsersResponseSchema = z.object({
  results: z.array(SearchResultItemResponseSchema),
  total: z.number(),
});
export type SearchUsersResponse = z.infer<typeof SearchUsersResponseSchema>;

// Error response
export const AccessControlErrorResponseSchema = z.object({
  error: z.object({
    type: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
export type AccessControlErrorResponse = z.infer<typeof AccessControlErrorResponseSchema>;
