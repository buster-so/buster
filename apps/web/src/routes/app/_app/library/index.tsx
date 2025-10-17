import { createFileRoute } from '@tanstack/react-router';
import { getCookie } from '@/api/server-functions/getCookie';
import {
  type LibraryLayout,
  layoutSchema,
  searchParamsSchema,
} from '@/controllers/LibraryController/schema';

const LAYOUT_COOKIE_NAME = 'library-layout';

export const Route = createFileRoute('/app/_app/library/')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  beforeLoad: async () => {
    const libraryLayout: LibraryLayout = await getCookie({
      data: { cookieName: LAYOUT_COOKIE_NAME },
    }).then((v) => {
      return layoutSchema.catch('grid').parse(v);
    });
    return { libraryLayout };
  },
  loader: async ({ context }) => {
    return { libraryLayout: context.libraryLayout };
  },
});

function RouteComponent() {
  const { libraryLayout } = Route.useLoaderData();
  return <div>Hello "/app/_app/library/"! {libraryLayout}</div>;
}
