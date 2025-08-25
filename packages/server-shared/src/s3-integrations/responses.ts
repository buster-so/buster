import { z } from 'zod';

// Storage provider enum matching database
export const StorageProviderSchema = z.enum(['s3', 'r2', 'gcs']);

// S3 Integration response schema
export const S3IntegrationResponseSchema = z.object({
  id: z.string().uuid(),
  provider: StorageProviderSchema,
  organizationId: z.string().uuid(),
  bucketName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

// Create integration response
export const CreateS3IntegrationResponseSchema = S3IntegrationResponseSchema;

// Get integration response
export const GetS3IntegrationResponseSchema = S3IntegrationResponseSchema.nullable();

// Delete integration response
export const DeleteS3IntegrationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

// List integrations response (for potential future use)
export const ListS3IntegrationsResponseSchema = z.object({
  integrations: z.array(S3IntegrationResponseSchema),
  total: z.number(),
});

// Types
export type StorageProvider = z.infer<typeof StorageProviderSchema>;
export type S3IntegrationResponse = z.infer<typeof S3IntegrationResponseSchema>;
export type CreateS3IntegrationResponse = z.infer<typeof CreateS3IntegrationResponseSchema>;
export type GetS3IntegrationResponse = z.infer<typeof GetS3IntegrationResponseSchema>;
export type DeleteS3IntegrationResponse = z.infer<typeof DeleteS3IntegrationResponseSchema>;
export type ListS3IntegrationsResponse = z.infer<typeof ListS3IntegrationsResponseSchema>;
