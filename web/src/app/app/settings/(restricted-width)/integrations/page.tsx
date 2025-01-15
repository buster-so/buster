import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Integrations"
        description="Enhance your Buster experience with a wide variety of add-ons & integrations"
      />
      <SettingsEmptyState />
    </div>
  );
}
