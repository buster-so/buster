import { BaseScreenshotSearchSchema } from '@buster/server-shared/screenshots';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ensureColorPalettes } from '@/api/buster_rest/dictionaries';
import { ensureGetMyUserInfo } from '@/api/buster_rest/users';

export const Route = createFileRoute('/screenshots')({
  ssr: true,
  component: RouteComponent,
  beforeLoad: async ({ search }) => {
    return {
      backgroundColor: search.backgroundColor,
    };
  },
  validateSearch: BaseScreenshotSearchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      ensureGetMyUserInfo(context.queryClient),
      ensureColorPalettes(context.queryClient),
    ]);
    return {
      backgroundColor: context.backgroundColor,
    };
  },
  head: ({ loaderData }) => ({
    styles: [
      {
        children: `body { background: ${loaderData?.backgroundColor || '#ffffff'}; min-width: auto; }`,
      },
    ],
  }),
});

function RouteComponent() {
  return <Outlet />;
}
