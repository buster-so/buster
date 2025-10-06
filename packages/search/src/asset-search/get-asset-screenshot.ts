import { type StorageProvider, getProviderForOrganization } from '@buster/data-source';
import { z } from 'zod';

const GetAssetScreenshotParamsSchema = z.object({
  key: z.string(),
  organizationId: z.string().uuid().optional(),
  expiresIn: z.number().int().positive().optional(),
});

export type GetAssetScreenshotParams = z.infer<typeof GetAssetScreenshotParamsSchema>;

export async function getAssetScreenshotSignedUrl(
  params: GetAssetScreenshotParams,
  provider?: StorageProvider
): Promise<string> {
  const { key, expiresIn, organizationId } = GetAssetScreenshotParamsSchema.parse(params);
  if (!organizationId && !provider) {
    throw new Error('Provider or organization ID is required');
  }
  const s3Client = provider ?? (await getProviderForOrganization(organizationId ?? ''));

  // Asume the key is valid and exists because we have received it from the database
  return s3Client.getSignedUrl(key, expiresIn ?? 900);
}
