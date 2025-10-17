import { createFileRoute } from '@tanstack/react-router';
import { getCookie } from '@/api/server-functions/getCookie';
import { LAYOUT_COOKIE_NAME } from '@/context/Library/useLibraryLayout';
import { LibraryController } from '@/controllers/LibraryController/LibraryController';
import {
  type LibraryLayout,
  searchParamsSchema,
  wrappedLayoutSchema,
} from '@/controllers/LibraryController/schema';

export const Route = createFileRoute('/app/_app/library/')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  beforeLoad: async () => {
    const libraryLayout: LibraryLayout = await getCookie({ data: LAYOUT_COOKIE_NAME }).then((v) =>
      wrappedLayoutSchema.parse(v)
    );
    return { libraryLayout };
  },
  loader: async ({ context }) => {
    return { libraryLayout: context.libraryLayout };
  },
});

function RouteComponent() {
  const { libraryLayout } = Route.useLoaderData();
  const filters = Route.useSearch();
  return <LibraryController filters={filters} layout={libraryLayout} />;
}
