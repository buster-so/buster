import { useGetDatasets } from '@/api/buster_rest';
import { AppSelectMultiple } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { Select } from 'antd';
import React, { useMemo, useState } from 'react';

export const SelectedDatasetInput: React.FC<{
  onSetDatasetId: (datasetIds: string[]) => void;
  mode?: 'multiple' | 'single';
}> = React.memo(({ onSetDatasetId, mode = 'multiple' }) => {
  const { data: datasets, isFetched } = useGetDatasets();
  const [value, setValue] = useState<string[]>([]);

  const onChangePreflight = useMemoizedFn((value: string[]) => {
    setValue(value);
    onSetDatasetId(value);
  });

  const options = useMemo(() => {
    return datasets?.map((dataset) => ({
      label: dataset.name,
      value: dataset.id
    }));
  }, [datasets]);

  if (mode === 'single') {
    return (
      <Select
        options={options}
        onChange={onChangePreflight}
        value={value}
        placeholder="Select a dataset"
        loading={!isFetched}
        className="w-full"
      />
    );
  }

  return (
    <AppSelectMultiple
      options={options}
      onChange={onChangePreflight}
      value={value}
      placeholder="Select a dataset"
      loading={!isFetched}
      className="w-full"
    />
  );
});

SelectedDatasetInput.displayName = 'SelectedDatasetInput';
