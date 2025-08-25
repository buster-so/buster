import { SlackIntegrations } from '@/components/features/integrations/SlackIntegrations';
import { StorageIntegrations } from '@/components/features/integrations/StorageIntegrations';
import { SettingsPageHeader } from '@/components/features/settings';

export default function IntegrationsPage() {
  return (
    <>
      <SettingsPageHeader
        title="Integrations"
        description="Connect Buster with other apps and services"
      />

      <div className="flex flex-col space-y-6">
        <SlackIntegrations />
        <StorageIntegrations />
      </div>
    </>
  );
}
