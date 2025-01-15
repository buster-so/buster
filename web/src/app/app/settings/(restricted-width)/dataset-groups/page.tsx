'use client';

import React from 'react';
import { SettingsEmptyState } from '../../_SettingsEmptyState';
import { SettingsPageHeader } from '../../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="Dataset Groups"
        description="Organize and manage groups of related datasets"
      />
      <SettingsEmptyState />
    </div>
  );
}
