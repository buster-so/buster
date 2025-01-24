import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

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
