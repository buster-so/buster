import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { checkIfUserIsAdmin_server } from '@/server_context/user';

export default async function Page() {
  const isAdmin = await checkIfUserIsAdmin_server();

  if (!isAdmin) {
    return redirect(
      createBusterRoute({
        route: BusterRoutes.SETTINGS_PROFILE
      })
    );
  }

  return (
    <div>
      <SettingsPageHeader title="Billing" description="Manage invoice, payment methods, & more" />

      <SettingsEmptyState />
    </div>
  );
}
