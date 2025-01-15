'use client';

import React from 'react';
import { SettingsEmptyState } from '../_SettingsEmptyState';
import { SettingsPageHeader } from '../_SettingsPageHeader';

export default function Page() {
  return (
    <div>
      <SettingsPageHeader
        title="User Management"
        description="Manage your organization's users and their permissions"
      />
      <SettingsEmptyState />
    </div>
  );
}
