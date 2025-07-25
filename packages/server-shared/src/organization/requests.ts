import { z } from 'zod';
import { OrganizationColorPaletteSchema } from './organization.types';

// Update Organization Request/Response Types
export const UpdateOrganizationRequestSchema = z.object({
  organizationColorPalettes: OrganizationColorPaletteSchema,
});

export type UpdateOrganizationRequest = z.infer<typeof UpdateOrganizationRequestSchema>;
