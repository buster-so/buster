import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader title="General" description="Manage your workspace details & settings" />

      <SettingsEmptyState />
    </div>
  );
}
