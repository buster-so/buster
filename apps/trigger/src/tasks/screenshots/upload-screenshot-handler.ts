import { getProviderForOrganization } from '@buster/data-source';
import { updateAssetScreenshotBucketKey } from '@buster/database/queries';
import type { AssetType } from '@buster/server-shared/assets';
import { AssetTypeSchema } from '@buster/server-shared/assets';
import {
  PutChatScreenshotRequestSchema,
  type PutScreenshotResponse,
  PutScreenshotResponseSchema,
} from '@buster/server-shared/screenshots';
import { logger } from '@trigger.dev/sdk';
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

function detectImageTypeFromBuffer(buffer: Buffer): { contentType: string; extension: string } {
  // Check PNG signature (89 50 4E 47)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { contentType: 'image/png', extension: '.png' };
  }

  // Check JPEG signature (FF D8 FF)
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: '.jpg' };
  }

  // Check WebP signature (RIFF ... WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { contentType: 'image/webp', extension: '.webp' };
  }

  // Default to PNG if unknown
  return { contentType: 'image/png', extension: '.png' };
}

function parseBuffer(buffer: Buffer): {
  buffer: Buffer;
  contentType: string;
  extension: string;
} {
  const { contentType, extension } = detectImageTypeFromBuffer(buffer);
  return {
    buffer,
    contentType,
    extension,
  };
}

async function parseImageInput(image: string | File | Buffer): Promise<{
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  if (Buffer.isBuffer(image)) {
    return parseBuffer(image);
  }
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
  logger.info('Uploading screenshot', { params });

  const { assetType, assetId, image, organizationId } = UploadScreenshotParamsSchema.parse(params);

  logger.info('Parsing image input', { image });

  const { buffer, contentType, extension } = await parseImageInput(image);

  logger.info('Building screenshot key', { assetType, assetId, extension, organizationId });

  const targetKey = buildScreenshotKey(assetType, assetId, extension, organizationId);

  const provider = await getProviderForOrganization(organizationId);

  logger.info('Uploading screenshot', { targetKey });

  const result = await provider.upload(targetKey, buffer, {
    contentType,
  });

  logger.info('Screenshot uploaded', { result });

  if (!result.success) {
    throw new Error(result.error ?? 'Failed to upload screenshot');
  }

  const resultOfUpload = await updateAssetScreenshotBucketKey({
    assetId,
    assetType,
    screenshotBucketKey: result.key,
  });

  logger.info('Screenshot uploaded', { resultOfUpload });

  return PutScreenshotResponseSchema.parse({
    success: true,
    bucketKey: result.key,
  });
}
