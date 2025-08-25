import { z } from 'zod';

// Base schema for common fields
const BaseIntegrationSchema = z.object({
  bucket: z.string().min(1, 'Bucket name is required'),
});

// AWS S3 specific schema
export const S3IntegrationSchema = BaseIntegrationSchema.extend({
  provider: z.literal('s3'),
  region: z.string().min(1, 'Region is required for S3'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
});

// Cloudflare R2 specific schema
export const R2IntegrationSchema = BaseIntegrationSchema.extend({
  provider: z.literal('r2'),
  accountId: z.string().min(1, 'Account ID is required for R2'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
});

// Google Cloud Storage specific schema
export const GCSIntegrationSchema = BaseIntegrationSchema.extend({
  provider: z.literal('gcs'),
  projectId: z.string().min(1, 'Project ID is required for GCS'),
  serviceAccountKey: z.string().min(1, 'Service Account Key JSON is required'),
});

// Discriminated union for create request
export const CreateS3IntegrationRequestSchema = z.discriminatedUnion('provider', [
  S3IntegrationSchema,
  R2IntegrationSchema,
  GCSIntegrationSchema,
]);

// Delete request schema
export const DeleteS3IntegrationRequestSchema = z.object({
  id: z.string().uuid('Invalid integration ID'),
});

// Types
export type S3Integration = z.infer<typeof S3IntegrationSchema>;
export type R2Integration = z.infer<typeof R2IntegrationSchema>;
export type GCSIntegration = z.infer<typeof GCSIntegrationSchema>;
export type CreateS3IntegrationRequest = z.infer<typeof CreateS3IntegrationRequestSchema>;
export type DeleteS3IntegrationRequest = z.infer<typeof DeleteS3IntegrationRequestSchema>;
