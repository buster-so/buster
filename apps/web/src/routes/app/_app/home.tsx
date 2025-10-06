import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchListShortcuts } from '@/api/buster_rest/shortcuts/queryRequests';
import {
  prefetchGetMyUserInfo,
  prefetchGetSuggestedPrompts,
} from '@/api/buster_rest/users/queryRequests';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { HomePageHeader } from '@/controllers/HomePage';

export const Route = createFileRoute('/app/_app/home')({
  ssr: false,
  head: () => {
    return {
      meta: [
        { title: 'Home' },
        { name: 'description', content: 'Buster home dashboard' },
        { name: 'og:title', content: 'Home' },
        { name: 'og:description', content: 'Buster home dashboard' },
      ],
    };
  },
  loader: async ({ context }) => {
    const { queryClient } = context;
    const user = await prefetchGetMyUserInfo(queryClient);
    if (user?.user?.id) {
      await Promise.all([
        prefetchListShortcuts(queryClient),
        prefetchGetSuggestedPrompts(user.user.id, queryClient),
      ]);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<HomePageHeader />} scrollable>
      <Outlet />
    </AppPageLayout>
  );
}
