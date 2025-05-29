'use client';

import { useGetDatasetGroup, useUpdateDatasetGroup } from '@/api/buster_rest';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { useMemoizedFn } from '@/hooks';
import React from 'react';

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
      <EditableTitle children={data?.name || ''} onChange={onChangeTitle} />
    </div>
  );
});

DatasetGroupTitleAndDescription.displayName = 'DatasetGroupTitleAndDescription';
