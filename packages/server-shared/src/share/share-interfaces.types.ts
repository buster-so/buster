import { AssetPermissionRoleSchema, WorkspaceSharingSchema } from '@buster/database/schema-types';
import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';

export { AssetPermissionRoleSchema, WorkspaceSharingSchema };
export const ShareRoleSchema = AssetPermissionRoleSchema;
export const WorkspaceShareRoleSchema = WorkspaceSharingSchema;
export const ShareAssetTypeSchema = AssetTypeSchema;

export const ShareIndividualSchema = z.object({
  email: z.string(),
  role: AssetPermissionRoleSchema,
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const ShareConfigSchema = z.object({
  individual_permissions: z.array(ShareIndividualSchema).nullable(),
  public_expiry_date: z.string().nullable(),
  public_enabled_by: z.string().nullable(),
  publicly_accessible: z.boolean(),
  public_password: z.string().nullable(),
  permission: AssetPermissionRoleSchema, //this is the permission the user has to the metric, dashboard or collection
  workspace_sharing: WorkspaceSharingSchema.nullable(),
  workspace_member_count: z.number().nullable(),
  added_to_library: z.boolean(),
});

// Export the inferred types
export type ShareRole = z.infer<typeof ShareRoleSchema>;
export type WorkspaceShareRole = z.infer<typeof WorkspaceShareRoleSchema>;
export type ShareAssetType = z.infer<typeof ShareAssetTypeSchema>;
export type ShareIndividual = z.infer<typeof ShareIndividualSchema>;
export type ShareConfig = z.infer<typeof ShareConfigSchema>;
