import type { PaginatedResponse } from '@buster/database/schema-types';
import { PaginationSchema } from '@buster/database/schema-types';
import { z } from 'zod';
import { CredentialsSchema } from './requests';
import { SanitizedCredentialsSchema } from './sanitize-credentials';

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
 * Dataset summary information
 */
export const DatasetSummarySchema = z.object({
  id: z.string().uuid().describe('Dataset ID'),
  name: z.string().describe('Dataset name'),
});

/**
 * Base data source fields shared across response types
 */
const BaseDataSourceSchema = z.object({
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

/**
 * Create data source response schema (no credentials or datasets)
 */
export const CreateDataSourceResponseSchema = BaseDataSourceSchema;

/**
 * Get data source response schema (includes sanitized credentials and datasets)
 * Note: Credentials in responses have sensitive fields redacted for security
 */
export const GetDataSourceResponseSchema = BaseDataSourceSchema.extend({
  credentials: SanitizedCredentialsSchema.describe(
    'Data source credentials (sensitive fields redacted)'
  ),
  datasets: z.array(DatasetSummarySchema).describe('Associated datasets'),
});

/**
 * List item schema (minimal fields for list view)
 */
export const DataSourceListItemSchema = z.object({
  id: z.string().uuid().describe('Data source ID'),
  name: z.string().describe('Data source name'),
  type: z.string().describe('Data source type'),
  updatedAt: z.string().datetime().describe('Last update timestamp'),
});

/**
 * List data sources response schema (paginated)
 */
export const ListDataSourcesResponseSchema = z.object({
  data: z.array(DataSourceListItemSchema).describe('Array of data source list items'),
  pagination: PaginationSchema.describe('Pagination metadata'),
});

/**
 * Update data source response schema (same as get response)
 */
export const UpdateDataSourceResponseSchema = GetDataSourceResponseSchema;

// Export inferred types
export type CreatedBy = z.infer<typeof CreatedBySchema>;
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type DatasetSummary = z.infer<typeof DatasetSummarySchema>;
export type CreateDataSourceResponse = z.infer<typeof CreateDataSourceResponseSchema>;
export type GetDataSourceResponse = z.infer<typeof GetDataSourceResponseSchema>;
export type DataSourceListItem = z.infer<typeof DataSourceListItemSchema>;
export type ListDataSourcesResponse = PaginatedResponse<DataSourceListItem>;
export type UpdateDataSourceResponse = z.infer<typeof UpdateDataSourceResponseSchema>;
