import { BaseScreenshotSearchSchema } from '@buster/server-shared/screenshots';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ensureGetMyUserInfo } from '@/api/buster_rest/users';

export const Route = createFileRoute('/screenshots')({
  ssr: true,
  component: RouteComponent,
  beforeLoad: async ({ context, search }) => {
    await ensureGetMyUserInfo(context.queryClient);
    return {
      backgroundColor: search.backgroundColor,
    };
  },
  validateSearch: BaseScreenshotSearchSchema,
  loader: ({ context }) => ({
    backgroundColor: context.backgroundColor,
  }),
  head: ({ loaderData }) => ({
    styles: [
      {
        children: `body { background: ${loaderData?.backgroundColor || '#ffffff'}; }`,
      },
    ],
  }),
});

function RouteComponent() {
  return <Outlet />;
}
