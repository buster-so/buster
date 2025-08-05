import type { assetPermissionRoleEnum, workspaceSharingEnum } from '@buster/database';
import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';

type ShareRoleBase = (typeof assetPermissionRoleEnum.enumValues)[number];
export const ShareRoleEnumsConversions: Record<ShareRoleBase, ShareRoleBase> = Object.freeze({
  owner: 'owner',
  full_access: 'full_access',
  can_edit: 'can_edit',
  can_view: 'can_view',
  viewer: 'viewer',
  can_filter: 'can_filter',
});

export const ShareRoleSchema = z.enum(
  Object.values(ShareRoleEnumsConversions) as [ShareRoleBase, ...ShareRoleBase[]]
);

//type TeamRoleBase = (typeof teamRoleEnum.enumValues)[number] | 'none';
type WorkspaceShareRoleBase = (typeof workspaceSharingEnum.enumValues)[number];
const WorkspaceShareRoleEnumsConversions: Record<WorkspaceShareRoleBase, WorkspaceShareRoleBase> =
  Object.freeze({
    full_access: 'full_access',
    can_edit: 'can_edit',
    can_view: 'can_view',
    none: 'none',
  });

export const WorkspaceShareRoleSchema = z.enum(
  Object.values(WorkspaceShareRoleEnumsConversions) as [
    WorkspaceShareRoleBase,
    ...WorkspaceShareRoleBase[],
  ]
);
export const ShareAssetTypeSchema = AssetTypeSchema;

export const ShareIndividualSchema = z.object({
  email: z.string(),
  role: ShareRoleSchema,
  name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const ShareConfigSchema = z.object({
  individual_permissions: z.array(ShareIndividualSchema).nullable(),
  public_expiry_date: z.string().nullable(),
  public_enabled_by: z.string().nullable(),
  publicly_accessible: z.boolean(),
  public_password: z.string().nullable(),
  permission: ShareRoleSchema, //this is the permission the user has to the metric, dashboard or collection
  workspace_sharing: WorkspaceShareRoleSchema.nullable(),
  workspace_member_count: z.number().nullable(),
});

// Export the inferred types
export type ShareRole = z.infer<typeof ShareRoleSchema>;
export type WorkspaceShareRole = z.infer<typeof WorkspaceShareRoleSchema>;
export type ShareAssetType = z.infer<typeof ShareAssetTypeSchema>;
export type ShareIndividual = z.infer<typeof ShareIndividualSchema>;
export type ShareConfig = z.infer<typeof ShareConfigSchema>;
