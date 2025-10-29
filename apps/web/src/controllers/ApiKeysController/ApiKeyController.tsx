import { SettingsPageHeader } from '@/components/features/settings';
import { ApiKeysContentController } from './ApiKeysContentController';

export const ApiKeyController = () => {
  return (
    <>
      <SettingsPageHeader
        title="API keys"
        description="Enhance your Buster experience with a wide variety of add-ons & integrations"
      />

      <ApiKeysContentController />
    </>
  );
};
