import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

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
