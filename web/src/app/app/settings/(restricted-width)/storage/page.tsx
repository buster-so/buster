import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Storage & data"
        description="Manage where your data can be sent, what data can be stored, etc"
      />
      <SettingsEmptyState />
    </div>
  );
}
