import { SettingsPageHeader } from '../../../_components/SettingsPageHeader';
import { ApiKeysController } from './ApiKeysController';

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
