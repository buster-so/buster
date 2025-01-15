import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Permission Groups"
        description="Manage security & how members authenticate"
      />
      <SettingsEmptyState />
    </div>
  );
}
