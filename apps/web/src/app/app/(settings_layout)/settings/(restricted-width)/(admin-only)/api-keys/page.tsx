import { SettingsPageHeader } from '../../../_components/SettingsPageHeader';
import { ApiKeysController } from './ApiKeysController';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API keys'
};

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="API keys"
        description="Enhance your Buster experience with a wide variety of add-ons & integrations"
      />

      <ApiKeysController />
    </div>
  );
}
