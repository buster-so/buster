import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Notifications"
        description="Manage where & when you’ll be notified"
      />

      <SettingsEmptyState />
    </div>
  );
}
