import { createFileRoute } from '@tanstack/react-router';
import { ApiKeyController } from '@/controllers/ApiKeysController/ApiKeyController';

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/api-keys'
)({
  head: () => ({
    meta: [
      { title: 'API Keys' },
      { name: 'description', content: 'Manage your API keys and integrations' },
      { name: 'og:title', content: 'API Keys' },
      { name: 'og:description', content: 'Manage your API keys and integrations' },
    ],
  }),
  loader: async () => {},
  component: ApiKeyController,
});
