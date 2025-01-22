import { useCheckIfUserIsAdmin_server } from '../../../../../server_context/user';
import { SettingsPageHeader } from '../../_SettingsPageHeader';
import { ApiKeysController } from './ApiKeysController';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { redirect } from 'next/navigation';

export default async function Page() {
  const isAdmin = await useCheckIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.APP_SETTINGS_USERS
      })
    );
  }

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
