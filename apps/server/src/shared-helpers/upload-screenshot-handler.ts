import { getProviderForOrganization } from '@buster/data-source';
import { updateAssetScreenshotBucketKey } from '@buster/database/queries';
import type { AssetType } from '@buster/server-shared/assets';
import { AssetTypeSchema } from '@buster/server-shared/assets';
import {
  PutScreenshotRequestSchema,
  type PutScreenshotResponse,
  PutScreenshotResponseSchema,
} from '@buster/server-shared/screenshots';
import z from 'zod';

export const UploadScreenshotParamsSchema = PutScreenshotRequestSchema.extend({
  assetType: AssetTypeSchema,
  assetId: z.string().uuid('Asset ID must be a valid UUID'),
  organizationId: z.string().uuid('Organization ID must be a valid UUID'),
});

export type UploadScreenshotParams = z.infer<typeof UploadScreenshotParamsSchema>;

function getExtensionFromContentType(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.png';
  }
}

function parseBase64Image(base64Image: string): {
  buffer: Buffer;
  contentType: string;
  extension: string;
} {
  const dataUriPattern = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/;
  const match = base64Image.match(dataUriPattern);

  const contentType = match?.groups?.mime ?? 'image/png';
  const base64Data = match?.groups?.data ?? base64Image;

  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length === 0) {
    throw new Error('Provided image data is empty');
  }

  return {
    buffer,
    contentType,
    extension: getExtensionFromContentType(contentType),
  };
}

function buildScreenshotKey(
  assetType: AssetType,
  assetId: string,
  extension: string,
  organizationId: string
): string {
  return `screenshots/${organizationId}/${assetType}-${assetId}${extension}`;
}

export async function uploadScreenshotHandler(
  params: UploadScreenshotParams
): Promise<PutScreenshotResponse> {
  const { assetType, assetId, base64Image, organizationId } =
    UploadScreenshotParamsSchema.parse(params);

  const { buffer, contentType, extension } = parseBase64Image(base64Image);

  const targetKey = buildScreenshotKey(assetType, assetId, extension, organizationId);

  const provider = await getProviderForOrganization(organizationId);
  const result = await provider.upload(targetKey, buffer, {
    contentType,
  });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to upload screenshot');
  }

  await updateAssetScreenshotBucketKey({
    assetId,
    assetType,
    screenshotBucketKey: result.key,
  });

  return PutScreenshotResponseSchema.parse({
    success: true,
    bucketKey: result.key,
  });
}
