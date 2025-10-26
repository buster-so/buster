import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { getCookie } from '@/api/server-functions/getCookie';
import { SHARED_WITH_ME_LAYOUT_COOKIE_NAME } from '@/context/Library/useSharedWithMeLayout';
import { computeSharedWithMeFilters } from '@/controllers/LibraryController/compute-library-filters';
import {
  type SharedWithMeLayout,
  searchParamsSchema,
  wrappedLayoutSchema,
} from '@/controllers/LibraryController/schema';

export const Route = createFileRoute('/app/_app/shared-with-me')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  beforeLoad: async ({ search }) => {
    const layout: SharedWithMeLayout = await getCookie({
      data: SHARED_WITH_ME_LAYOUT_COOKIE_NAME,
    }).then((v) => wrappedLayoutSchema.parse(search.layout ?? v));
    return { layout, search };
  },
  loader: async ({ context: { queryClient, search, layout } }) => {
    const userId = await prefetchGetMyUserInfo(queryClient).then((v) => v?.user?.id || '');
    const computedFilters = computeSharedWithMeFilters(search, userId);
    await Promise.all([]);
    return { layout };
  },
});

function RouteComponent() {
  return <div>Hello "/app/_app/shared-with-me"!</div>;
}
