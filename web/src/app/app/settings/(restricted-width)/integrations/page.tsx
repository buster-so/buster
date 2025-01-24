import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

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
