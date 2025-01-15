import { EditableTitle, Text } from '@/components';
import React from 'react';
import { useMemoizedFn } from 'ahooks';
import { useUpdateDataset } from '@/api/buster-rest';

export const OverviewHeader: React.FC<{ datasetId: string; description: string; name: string }> =
  React.memo(({ datasetId, description, name }) => {
    const { mutate: onUpdateDatasetGroup } = useUpdateDataset();

    const onEditTitle = useMemoizedFn((value: string) => {
      if (value) {
        onUpdateDatasetGroup({
          id: datasetId,
          name: value
        });
      }
    });

    return (
      <div className="flex justify-between space-x-2">
        <div className="flex space-x-4">
          <div className="flex flex-col space-y-1">
            <EditableTitle onChange={onEditTitle} level={3}>
              {name}
            </EditableTitle>
            <Text className="!text-md" type="secondary">
              {description}
            </Text>
          </div>
        </div>
      </div>
    );
  });
OverviewHeader.displayName = 'OverviewHeader';
