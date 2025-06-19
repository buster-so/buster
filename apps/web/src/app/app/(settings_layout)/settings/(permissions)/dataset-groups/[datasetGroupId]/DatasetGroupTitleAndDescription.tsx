'use client';

import React from 'react';
import { useGetDatasetGroup, useUpdateDatasetGroup } from '@/api/buster_rest';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { useMemoizedFn } from '@/hooks';

export const DatasetGroupTitleAndDescription: React.FC<{
  datasetGroupId: string;
}> = React.memo(({ datasetGroupId }) => {
  const { data } = useGetDatasetGroup(datasetGroupId);
  const { mutate: updateDatasetGroup } = useUpdateDatasetGroup();

  const onChangeTitle = useMemoizedFn(async (name: string) => {
    if (!name) return;
    updateDatasetGroup([{ id: datasetGroupId, name }]);
  });

  return (
    <div className="flex flex-col space-y-0.5">
      <EditableTitle onChange={onChangeTitle}>{data?.name || ''}</EditableTitle>
    </div>
  );
});

DatasetGroupTitleAndDescription.displayName = 'DatasetGroupTitleAndDescription';
