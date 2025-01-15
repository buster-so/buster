'use client';

import React from 'react';
import { Text, Title } from '@/components';
import { Divider } from 'antd';

export const SettingsPageHeader: React.FC<{
  title: string;
  description: string;
  type?: 'default' | 'alternate';
}> = React.memo(({ title, description, type = 'default' }) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-1.5">
        <Title level={3}>{title}</Title>
        <Text type="secondary">{description}</Text>
      </div>

      <Divider className="!my-6" />
    </div>
  );
});

SettingsPageHeader.displayName = 'SettingsPageHeader';
