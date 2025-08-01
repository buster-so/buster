'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Text, Title } from '@/components/ui/typography';

export const SettingsPageHeader: React.FC<{
  title: string;
  description: string;
  type?: 'default' | 'alternate';
}> = React.memo(({ title, description, type = 'default' }) => {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col space-y-1.5">
        <Title as="h3">{title}</Title>
        <Text variant="secondary">{description}</Text>
      </div>

      <Separator className="my-6!" />
    </div>
  );
});

SettingsPageHeader.displayName = 'SettingsPageHeader';
