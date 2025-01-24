import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader title="Preferences" description="Manage preferences for you account" />
      <SettingsEmptyState />
    </div>
  );
}
