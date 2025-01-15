import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader title="Preferences" description="Manage preferences for you account" />
      <SettingsEmptyState />
    </div>
  );
}
