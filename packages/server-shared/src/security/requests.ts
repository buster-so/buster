import { z } from 'zod';
import { UserOrganizationRoleSchema } from '../organization';

export const UpdateInviteLinkRequestSchema = z.object({
  enabled: z.boolean().optional(),
  refresh_link: z.boolean().optional(),
});

export type UpdateInviteLinkRequest = z.infer<typeof UpdateInviteLinkRequestSchema>;

export const AddApprovedDomainRequestSchema = z.object({
  domains: z.array(z.string()),
});

export type AddApprovedDomainRequest = z.infer<typeof AddApprovedDomainRequestSchema>;

export const RemoveApprovedDomainRequestSchema = z.object({
  domains: z.preprocess((val) => {
    if (typeof val === 'string') {
      return [val];
    }
    return val;
  }, z.array(z.string())),
});

export type RemoveApprovedDomainRequest = z.infer<typeof RemoveApprovedDomainRequestSchema>;

export const UpdateWorkspaceSettingsRequestSchema = z.object({
  restrict_new_user_invitations: z.boolean().optional(),
  default_role: UserOrganizationRoleSchema.optional(),
  // this can either be a uuid or "all"
  default_datasets_ids: z.array(z.union([z.string(), z.literal('all')])).optional(),
});

export type UpdateWorkspaceSettingsRequest = z.infer<typeof UpdateWorkspaceSettingsRequestSchema>;
