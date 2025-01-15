import React from 'react';
import { SettingsPageHeader } from '../../_SettingsPageHeader';
import { SettingsEmptyState } from '../../_SettingsEmptyState';

export default function LogsPage() {
  return (
    <div>
      <SettingsPageHeader title="Profile" description="Manage your profile & information" />
      <SettingsEmptyState />
    </div>
  );
}
