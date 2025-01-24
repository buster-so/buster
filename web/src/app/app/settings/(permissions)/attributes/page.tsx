'use client';

import React from 'react';
import { SettingsEmptyState } from '../../_components/SettingsEmptyState';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Attribute Management"
        description="Configure and manage custom attributes for your data"
      />
      <SettingsEmptyState />
    </div>
  );
}
