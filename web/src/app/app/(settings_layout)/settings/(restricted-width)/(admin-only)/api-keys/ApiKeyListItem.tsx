import React, { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import type { BusterApiKeyListItem } from '@/api/asset_interfaces';

import { formatDate } from '@/lib/date';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { Trash } from '@/components/ui/icons';

interface ApiKeyListItemProps {
  apiKey: BusterApiKeyListItem;
  onDelete: (id: string) => void;
}

export const ApiKeyListItem: React.FC<ApiKeyListItemProps> = ({ apiKey, onDelete }) => {
  const date = useMemo(
    () => formatDate({ date: apiKey.created_at, format: 'LLL' }),
    [apiKey.created_at]
  );

  const handleDelete = useMemoizedFn(() => {
    onDelete(apiKey.id);
  });

  return (
    <div className="flex items-center justify-between space-y-1 rounded-md border bg-white p-3 shadow transition-shadow hover:shadow-xs">
      <div className="flex flex-col space-y-1">
        <Text size={'md'}>{apiKey.owner_email}</Text>
        <Text variant="secondary" size="sm">
          {`Created on: ${date}`}
        </Text>
      </div>
      <Button variant="danger" prefix={<Trash />} onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
};
