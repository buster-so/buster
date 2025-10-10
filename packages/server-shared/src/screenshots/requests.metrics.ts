import { z } from 'zod';
import { BaseScreenshotSearchSchema } from './requests.base';

export const GetMetricScreenshotParamsSchema = z.object({
  id: z.string(),
});

export const GetMetricScreenshotQuerySchema = z
  .object({
    version_number: z.coerce.number().min(1).optional(),
  })
  .merge(BaseScreenshotSearchSchema);

export type GetMetricScreenshotParams = z.infer<typeof GetMetricScreenshotParamsSchema>;
export type GetMetricScreenshotQuery = z.infer<typeof GetMetricScreenshotQuerySchema>;

export const PutMetricScreenshotRequestSchema = z.object({
  image: z
    .union([
      z.string().startsWith('data:image/').describe('Base64-encoded image with data URI prefix'),
      z.instanceof(File).refine((file) => file.type.startsWith('image/'), {
        message: 'File must be an image',
      }),
      z
        .any()
        .describe('Buffer containing raw image data'), // Buffer is not available in the browser
    ])
    .describe('Image as base64 data URI, File object, or Buffer'),
});
export const PutMetricScreenshotParamsSchema = z.object({
  id: z.string().uuid('Asset ID must be a valid UUID'),
});

export type PutMetricScreenshotRequest = {
  image: string | File | Buffer;
};
