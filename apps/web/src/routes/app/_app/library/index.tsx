import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetCollectionsList } from '@/api/buster_rest/collections';
import { prefetchGetLibraryAssetsInfinite } from '@/api/buster_rest/library';
import { prefetchGetMyUserInfo, prefetchGetUser } from '@/api/buster_rest/users';
import { getCookie } from '@/api/server-functions/getCookie';
import { LAYOUT_COOKIE_NAME } from '@/context/Library/useLibraryLayout';
import { computeLibraryFilters } from '@/controllers/LibraryController/compute-library-filters';
import { LibraryController } from '@/controllers/LibraryController/LibraryController';
import {
  type LibraryLayout,
  searchParamsSchema,
  wrappedLayoutSchema,
} from '@/controllers/LibraryController/schema';

export const Route = createFileRoute('/app/_app/library/')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  beforeLoad: async ({ search }) => {
    const libraryLayout: LibraryLayout = await getCookie({ data: LAYOUT_COOKIE_NAME }).then((v) =>
      wrappedLayoutSchema.parse(search.layout ?? v)
    );
    return { libraryLayout, search };
  },
  loader: async ({ context: { queryClient, search, libraryLayout } }) => {
    const userId = await prefetchGetMyUserInfo(queryClient).then((v) => v?.user?.id || '');
    const computedFilters = computeLibraryFilters(search, userId);
    await Promise.all([
      prefetchGetCollectionsList(queryClient),
      prefetchGetLibraryAssetsInfinite(queryClient, computedFilters),
    ]);
    return { libraryLayout };
  },
});

function RouteComponent() {
  const filters = Route.useSearch();
  const { libraryLayout } = Route.useLoaderData();
  return <LibraryController filters={filters} layout={libraryLayout} />;
}
