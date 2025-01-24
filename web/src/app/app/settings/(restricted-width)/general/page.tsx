import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader title="General" description="Manage your workspace details & settings" />

      <SettingsEmptyState />
    </div>
  );
}
