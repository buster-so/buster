import { z } from 'zod';

// Asset type enum
export const AssetTypeSchema = z.enum([
  'chat',
  'metric_file',
  'dashboard_file',
  'report_file',
  'collection',
]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

// Asset permission role enum
export const AssetPermissionRoleSchema = z.enum([
  'owner',
  'viewer',
  'can_view',
  'can_filter',
  'can_edit',
  'full_access',
]);

export type AssetPermissionRole = z.infer<typeof AssetPermissionRoleSchema>;

export const AncestorSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});

export type Ancestor = z.infer<typeof AncestorSchema>;

export interface AssetAncestors {
  chats: Ancestor[];
  collections: Ancestor[];
  dashboards: Ancestor[];
  reports: Ancestor[];
}
