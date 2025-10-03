import { createFileRoute } from '@tanstack/react-router';
import { createServerFileRoute } from '@tanstack/react-start/server';
import { z } from 'zod';

export const GetDashboardScreenshotParamsSchema = z.object({
  dashboardId: z.string(),
});

export const GetDashboardScreenshotQuerySchema = z.object({
  version_number: z.coerce.number().min(1).optional(),
  width: z.coerce.number().min(100).max(3840).default(800),
  height: z.coerce.number().min(100).max(2160).default(450),
  type: z.enum(['png', 'jpeg']).default('png'),
});

export const ServerRoute = createServerFileRoute('/screenshots/dashboard/$dashboardId/').methods({
  GET: async ({ request, params }) => {
    const { dashboardId } = GetDashboardScreenshotParamsSchema.parse(params);
    const { version_number, width, height, type } = GetDashboardScreenshotQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
  },
});
