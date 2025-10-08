import { z } from 'zod';
import { BaseScreenshotSearchSchema } from './requests.base';

export const GetMetricScreenshotParamsSchema = z.object({
  id: z.string(),
});

export const GetMetricScreenshotQuerySchema = z
  .object({
    version_number: z.coerce.number().min(1).optional(),
    width: z.coerce.number().min(100).max(3840).default(800),
    height: z.coerce.number().min(100).max(2160).default(450),
    type: z.enum(['png', 'jpeg']).default('png'),
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
      z.instanceof(Buffer).describe('Buffer containing raw image data'),
    ])
    .describe('Image as base64 data URI, File object, or Buffer'),
});
export const PutMetricScreenshotParamsSchema = z.object({
  id: z.string().uuid('Asset ID must be a valid UUID'),
});

export type PutMetricScreenshotRequest = z.infer<typeof PutMetricScreenshotRequestSchema>;
