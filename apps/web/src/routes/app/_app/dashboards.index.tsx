import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetDashboardsList } from '@/api/buster_rest/dashboards';
import { DashboardListController } from '@/controllers/DashboardListController';

export const Route = createFileRoute('/app/_app/dashboards/')({
  head: () => ({
    meta: [
      { title: 'Dashboards' },
      { name: 'description', content: 'View and manage your data dashboards' },
      { name: 'og:title', content: 'Dashboards' },
      { name: 'og:description', content: 'View and manage your data dashboards' },
    ],
  }),
  loader: async ({ context }) => {
    await prefetchGetDashboardsList(context.queryClient); //do not wait
  },
  component: DashboardListController,
});
