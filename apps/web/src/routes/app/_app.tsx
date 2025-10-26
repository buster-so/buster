import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchGetChatsList } from '@/api/buster_rest/chats';
import { prefetchListDatasources } from '@/api/buster_rest/data_source';
import { prefetchGetDatasets } from '@/api/buster_rest/datasets';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { prefetchGetUserFavorites } from '@/api/buster_rest/users/favorites';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { CHAT_HISTORY_SIDEBAR_ITEMS_LIMIT } from '@/components/features/sidebars/SidebarPrimary/useChatHistorySidebar';
import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import { PrimaryAppLayout } from '../../layouts/PrimaryAppLayout';
import { Route as NewUserRoute } from './_app/new-user';

const PRIMARY_APP_LAYOUT_ID = 'primary-sidebar';
const DEFAULT_LAYOUT: LayoutSize = ['230px', 'auto'];

export const Route = createFileRoute('/app/_app')({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = await prefetchGetMyUserInfo(context.queryClient);
    if (user && !user?.user.name && location.pathname !== NewUserRoute.to) {
      throw redirect({ to: '/app/new-user', replace: true, reloadDocument: true, statusCode: 307 });
    }
  },
  loader: async ({ context }) => {
    const { queryClient } = context;
    const [initialLayout] = await Promise.all([
      getAppLayout({ id: PRIMARY_APP_LAYOUT_ID }),
      prefetchGetUserFavorites(queryClient),
      prefetchListDatasources(queryClient),
      prefetchGetDatasets(queryClient),
      prefetchGetChatsList(queryClient, {
        page: 1,
        page_size: CHAT_HISTORY_SIDEBAR_ITEMS_LIMIT,
      }),
    ]);

    return {
      initialLayout,
      defaultLayout: DEFAULT_LAYOUT,
      layoutId: PRIMARY_APP_LAYOUT_ID,
    };
  },
  component: () => {
    const { initialLayout, defaultLayout } = Route.useLoaderData();

    return (
      <PrimaryAppLayout
        initialLayout={initialLayout}
        layoutId={PRIMARY_APP_LAYOUT_ID}
        defaultLayout={defaultLayout}
      >
        <Outlet />
      </PrimaryAppLayout>
    );
  },
});
