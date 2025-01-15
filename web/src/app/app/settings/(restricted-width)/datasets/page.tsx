'use client';

import React from 'react';
import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Dataset Management"
        description="Configure and manage your datasets and their settings"
      />
      <SettingsEmptyState />
    </div>
  );
}
