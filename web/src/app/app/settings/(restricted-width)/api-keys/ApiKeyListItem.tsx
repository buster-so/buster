import React, { useMemo } from 'react';
import { Button } from 'antd';
import { BusterApiKeyListItem } from '@/api/buster_rest/api_keys';
import { AppMaterialIcons } from '@/components/icons';
import { formatDate } from '@/utils/date';
import { Text } from '@/components';
import { useMemoizedFn } from 'ahooks';

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
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm">
      <div className="flex flex-col">
        <Text>{apiKey.owner_email}</Text>
        <div className="flex items-center gap-1">
          <Text type="secondary" size="sm">
            {`Created at: ${date}`}
          </Text>
        </div>
      </div>
      <Button danger type="text" icon={<AppMaterialIcons icon="delete" />} onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
};
