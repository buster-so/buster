import { z } from 'zod';

/**
 * Creator information included in data source response
 */
export const CreatedBySchema = z.object({
  id: z.string().uuid().describe('User ID'),
  email: z.string().email().describe('User email'),
  name: z.string().describe('User display name'),
});

/**
 * Data source onboarding status
 */
export const OnboardingStatusSchema = z.enum(['notStarted', 'inProgress', 'completed', 'failed']);

/**
 * Create data source response schema
 */
export const CreateDataSourceResponseSchema = z.object({
  id: z.string().uuid().describe('Unique data source identifier'),
  name: z.string().describe('Data source name'),
  type: z.string().describe('Data source type'),
  organizationId: z.string().uuid().describe('Organization that owns this data source'),
  createdBy: CreatedBySchema.describe('User who created the data source'),
  createdAt: z.string().datetime().describe('Creation timestamp (ISO 8601)'),
  updatedAt: z.string().datetime().describe('Last update timestamp (ISO 8601)'),
  deletedAt: z.string().datetime().nullable().describe('Soft delete timestamp'),
  onboardingStatus: OnboardingStatusSchema.describe('Current onboarding status'),
  onboardingError: z.string().nullable().describe('Error message if onboarding failed'),
});

// Types
export type CreatedBy = z.infer<typeof CreatedBySchema>;
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type CreateDataSourceResponse = z.infer<typeof CreateDataSourceResponseSchema>;
