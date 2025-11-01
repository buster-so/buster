import { z } from 'zod';

// User organization role enum
export const UserOrganizationRoleSchema = z.enum([
  'workspace_admin',
  'data_admin',
  'querier',
  'restricted_querier',
  'viewer',
]);
export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;

export const UserAttributesSchema = z.object({
  organization_id: z.string(),
  organization_role: z.custom<UserOrganizationRole>(),
  user_email: z.string().email(),
  user_id: z.string(),
});

export type UserAttributes = z.infer<typeof UserAttributesSchema>;

// User organization status enum
export const UserOrganizationStatusSchema = z.enum(['active', 'inactive', 'pending', 'guest']);
export type UserOrganizationStatus = z.infer<typeof UserOrganizationStatusSchema>;

// Team role enum
export const TeamRoleSchema = z.enum(['manager', 'member', 'none']);
export type TeamRole = z.infer<typeof TeamRoleSchema>;

export const UserSuggestedPromptsSchema = z.object({
  suggestedPrompts: z.object({
    report: z.array(z.string()),
    dashboard: z.array(z.string()),
    visualization: z.array(z.string()),
    help: z.array(z.string()),
  }),
  updatedAt: z.string(),
});

export const UserPersonalizationConfigSchema = z.object({
  currentRole: z.string().optional(),
  customInstructions: z.string().optional(),
  additionalInformation: z.string().optional(),
});

export const UserShortcutTrackingSchema = z.object({
  lastUsedShortcuts: z.array(z.string().uuid()).default([]),
});

export type UserSuggestedPromptsType = z.infer<typeof UserSuggestedPromptsSchema>;
export type UserPersonalizationConfigType = z.infer<typeof UserPersonalizationConfigSchema>;
export type UserShortcutTrackingType = z.infer<typeof UserShortcutTrackingSchema>;

export const DEFAULT_USER_SUGGESTED_PROMPTS: UserSuggestedPromptsType = {
  suggestedPrompts: {
    report: [
      'provide a trend analysis of quarterly profits',
      'evaluate product performance across regions',
    ],
    dashboard: ['create a sales performance dashboard', 'design a revenue forecast dashboard'],
    visualization: ['create a metric for monthly sales', 'show top vendors by purchase volume'],
    help: [
      'what types of analyses can you perform?',
      'what questions can I as buster?',
      'what data models are available for queries?',
      'can you explain your forecasting capabilities?',
    ],
  },
  updatedAt: new Date().toISOString(),
};
