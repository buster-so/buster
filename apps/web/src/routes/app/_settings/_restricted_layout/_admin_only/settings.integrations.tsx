import { createFileRoute } from '@tanstack/react-router';
import { prefetchS3Integration } from '@/api/buster_rest/s3-integrations';
import { prefetchSlackIntegration } from '@/api/buster_rest/slack';
import { GithubIntegrations } from '@/components/features/integrations/GithubIntegrations';
import { SlackIntegrations } from '@/components/features/integrations/SlackIntegrations';
import { StorageIntegrations } from '@/components/features/integrations/StorageIntegrations';
import { SettingsPageHeader } from '@/components/features/settings';

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/integrations'
)({
  head: () => ({
    meta: [
      { title: 'Integrations' },
      { name: 'description', content: 'Configure third-party integrations and connections' },
      { name: 'og:title', content: 'Integrations' },
      { name: 'og:description', content: 'Configure third-party integrations and connections' },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      prefetchSlackIntegration(context.queryClient),
      prefetchS3Integration(context.queryClient),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <SettingsPageHeader
        title="Integrations"
        description="Connect Buster with other apps and services"
      />

      <div className="flex flex-col space-y-6">
        <GithubIntegrations />
        <SlackIntegrations />
        <StorageIntegrations />
      </div>
    </>
  );
}
