import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Embedded Analytics"
        description="Embed a natural language data feature into your product"
      />
      <SettingsEmptyState />
    </div>
  );
}
