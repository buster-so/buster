import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchListDatasources } from '@/api/buster_rest/data_source';
import { prefetchGetDatasets } from '@/api/buster_rest/datasets';
import { prefetchGetUserFavorites } from '@/api/buster_rest/users/favorites/queryRequests';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppProviders } from '@/context/Providers';
import { getSupabaseSession, getSupabaseUser } from '@/integrations/supabase/getSupabaseUserClient';
import type { LayoutSize } from '../components/ui/layouts/AppLayout';

const PRIMARY_APP_LAYOUT_ID = 'primary-sidebar';
const DEFAULT_LAYOUT: LayoutSize = ['230px', 'auto'];

export const Route = createFileRoute('/app')({
  context: ({ context }) => ({ ...context, getAppLayout }),
  ssr: true,
  beforeLoad: async () => {
    const { isExpired, accessToken = '' } = await getSupabaseSession();

    if (isExpired || !accessToken) {
      throw redirect({ to: '/auth/login' });
    }

    return {
      accessToken,
    };
  },
  loader: async ({ context }) => {
    const { queryClient, accessToken } = context;
    try {
      const [initialLayout, user, userInfo, userFavorites, listDatasources, datasets] =
        await Promise.all([
          getAppLayout({ id: PRIMARY_APP_LAYOUT_ID }),
          getSupabaseUser(),
          prefetchGetMyUserInfo(queryClient),
          prefetchGetUserFavorites(queryClient),
          prefetchListDatasources(queryClient),
          prefetchGetDatasets(queryClient),
        ]);

      console.log('initialLayout', initialLayout);
      console.log('user', user?.id);
      console.log('userInfo', userInfo?.user?.id);
      console.log('userFavorites', userFavorites?.length);
      console.log('listDatasources', listDatasources?.length);
      console.log('datasets', datasets?.length);

      if (!user) {
        throw redirect({ to: '/auth/login' });
      }

      return {
        initialLayout,
        layoutId: PRIMARY_APP_LAYOUT_ID,
        defaultLayout: DEFAULT_LAYOUT,
        accessToken,
        user,
      };
    } catch (error) {
      console.error('Error in app route loader:', error);
      throw redirect({ to: '/auth/login' });
    }
  },
  component: () => {
    const { user, accessToken } = Route.useLoaderData();

    return (
      <AppProviders user={user} accessToken={accessToken}>
        <Outlet />
      </AppProviders>
    );
  },
  staleTime: Infinity,
  preloadStaleTime: Infinity,
  gcTime: 10 * 60 * 1000, // 10 minutes
});
