import { z } from 'zod';
import { ShareRoleSchema, WorkspaceShareRoleSchema } from './share-interfaces.types';

export const SharePostRequestSchema = z.array(
  z.object({
    email: z.string().email(),
    role: ShareRoleSchema,
    avatar_url: z.string().nullable().optional(),
    name: z.string().optional(),
  })
);

export type SharePostRequest = z.infer<typeof SharePostRequestSchema>;

//Used for updating share permissions for a report, collection, or metric
export const ShareUpdateRequestSchema = z.object({
  publicly_accessible: z.boolean().optional(),
  public_expiry_date: z.string().nullable().optional(),
  public_password: z.string().nullable().optional(),
  workspace_sharing: WorkspaceShareRoleSchema.optional(),
  users: z
    .array(
      z.object({
        email: z.string(),
        role: ShareRoleSchema,
      })
    )
    .optional(),
});

export type ShareUpdateRequest = z.infer<typeof ShareUpdateRequestSchema>;

//Used for deleting share permissions for a report, collection, or metric
export const ShareDeleteRequestSchema = z.array(z.string());

export type ShareDeleteRequest = z.infer<typeof ShareDeleteRequestSchema>;
