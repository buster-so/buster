'use client';

import React from 'react';
import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Security Settings"
        description="Configure security settings and access controls"
      />
      <SettingsEmptyState />
    </div>
  );
}
