import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const GetReportScreenshotParamsSchema = z.object({
  reportId: z.string(),
});

export const GetReportScreenshotQuerySchema = z.object({
  version_number: z.coerce.number().min(1).optional(),
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(2160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export const Route = createFileRoute('/screenshots/reports/$reportId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { reportId } = GetReportScreenshotParamsSchema.parse(params);
        const { version_number, width, height, type } = GetReportScreenshotQuerySchema.parse(
          Object.fromEntries(new URL(request.url).searchParams)
        );

        return new Response('Hello, World!');
      },
    },
  },
});
