import type { ReportElements } from '@buster/database';
import { z } from 'zod';
import { AssetCollectionsSchema } from '../collections/shared-asset-collections';
import { IndividualPermissionsSchema, ShareConfigSchema } from '../share';
import { VersionsSchema } from '../version-shared';

export const ReportListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string().nullable(),
  created_by_avatar: z.string().nullable(),
  updated_at: z.string(),
  publicly_accessible: z.boolean(),
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
  content: z.any() as z.ZodType<ReportElements>, //we use any here because we don't know the type of the content, will be validated in the database
  ...ShareConfigSchema.shape,
});

export type ReportListItem = z.infer<typeof ReportListItemSchema>;
export type ReportIndividualResponse = z.infer<typeof ReportIndividualResponseSchema>;
