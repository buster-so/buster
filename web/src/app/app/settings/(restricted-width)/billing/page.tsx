import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader title="Billing" description="Manage invoice, payment methods, & more" />

      <SettingsEmptyState />
    </div>
  );
}
