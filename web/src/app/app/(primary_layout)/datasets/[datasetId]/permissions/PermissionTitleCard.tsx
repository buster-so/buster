import React from 'react';
import { Title, Text } from '@/components/ui/typography';

export const PermissionTitleCard: React.FC = React.memo(() => {
  return (
    <div className="flex flex-col space-y-1">
      <Title as="h3">Dataset Permissions</Title>
      <Text size={'md'} variant="secondary">
        Manage who can build dashboards & metrics using this dataset
      </Text>
    </div>
  );
});

PermissionTitleCard.displayName = 'PermissionTitleCard';
