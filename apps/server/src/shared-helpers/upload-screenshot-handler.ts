import { getProviderForOrganization } from '@buster/data-source';
import { updateAssetScreenshotBucketKey } from '@buster/database/queries';
import type { AssetType } from '@buster/server-shared/assets';
import { AssetTypeSchema } from '@buster/server-shared/assets';
import {
  PutChatScreenshotRequestSchema,
  type PutScreenshotResponse,
  PutScreenshotResponseSchema,
} from '@buster/server-shared/screenshots';
import z from 'zod';

export const UploadScreenshotParamsSchema = PutChatScreenshotRequestSchema.extend({
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

async function parseImageFile(file: File): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new Error('Provided image file is empty');
  }

  return {
    buffer,
    contentType: file.type,
    extension: getExtensionFromContentType(file.type),
  };
}

async function parseImageInput(image: string | File): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  if (typeof image === 'string') {
    return parseBase64Image(image);
  }
  return parseImageFile(image);
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
  const { assetType, assetId, image, organizationId } = UploadScreenshotParamsSchema.parse(params);

  const { buffer, contentType, extension } = await parseImageInput(image);

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
