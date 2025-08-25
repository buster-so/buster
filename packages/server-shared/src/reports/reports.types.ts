import { z } from 'zod';
import { AssetCollectionsSchema } from '../collections/shared-asset-collections';
import { ShareConfigSchema } from '../share';
import { VersionsSchema } from '../version-shared';

export const ReportListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string().nullable(),
  created_by_avatar: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  publicly_accessible: z.boolean(),
  workspace_sharing: z.string(),
  is_shared: z.boolean(),
  permission: z.string().nullable(),
});

export const ReportIndividualResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string().nullable(),
  created_by_avatar: z.string().nullable(),
  version_number: z.number(),
  versions: VersionsSchema,
  collections: AssetCollectionsSchema,
  content: z.string(),
  ...ShareConfigSchema.shape,
});

export type ReportListItem = z.infer<typeof ReportListItemSchema>;
export type ReportIndividualResponse = z.infer<typeof ReportIndividualResponseSchema>;
