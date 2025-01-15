import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Permissions & Security"
        description="Manage security & how members authenticate"
      />
      <SettingsEmptyState />
    </div>
  );
}
