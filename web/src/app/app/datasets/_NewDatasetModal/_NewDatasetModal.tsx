import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Input, Select, SelectProps } from 'antd';
import { useMemoizedFn, useMount } from 'ahooks';
import { useDataSourceContextSelector } from '@/context/DataSources';
import { useCreateDataset } from '@/api/buster-rest/datasets';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useRouter } from 'next/navigation';
import { AppModal, Text } from '@/components';

const headerConfig = {
  title: 'Create a dataset',
  description: 'Select a datasource to create or import your dataset from.'
};

export const NewDatasetModal: React.FC<{
  open: boolean;
  onClose: () => void;
  beforeCreate?: () => void;
  afterCreate?: () => void;
  datasourceId?: string;
}> = React.memo(({ open, onClose, beforeCreate, afterCreate, datasourceId }) => {
  const router = useRouter();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const forceInitDataSourceList = useDataSourceContextSelector(
    (state) => state.forceInitDataSourceList
  );
  const { mutateAsync: createDataset, isPending: creatingDataset } = useCreateDataset();
  const [selectedDatasource, setSelectedDatasource] = React.useState<string | null>(
    datasourceId || null
  );
  const [datasetName, setDatasetName] = React.useState<string>('');

  const disableSubmit = !selectedDatasource || !datasetName;

  const createNewDatasetPreflight = useMemoizedFn(async () => {
    if (creatingDataset || disableSubmit || !selectedDatasource) return;

    beforeCreate?.();

    const res = await createDataset({
      data_source_id: selectedDatasource,
      name: datasetName
    });
    if (res.id) {
      onChangePage({
        route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
        datasetId: res.id
      });
      forceInitDataSourceList();
      setTimeout(() => {
        onClose();
        afterCreate?.();
      }, 150);
    }
  });

  const onAddDataSourceClick = useMemoizedFn(() => {
    router.push(createBusterRoute({ route: BusterRoutes.SETTINGS_DATASOURCES_ADD }));
    setTimeout(() => {
      onClose();
    }, 450);
  });

  useLayoutEffect(() => {
    if (open) {
      setSelectedDatasource(datasourceId || null);
    }
  }, [open]);

  const footerConfig = useMemo(() => {
    return {
      secondaryButton: {
        text: 'Add a datasource',
        onClick: onAddDataSourceClick
      },
      primaryButton: {
        text: 'Create dataset',
        onClick: createNewDatasetPreflight,
        loading: creatingDataset,
        disabled: disableSubmit
      }
    };
  }, [creatingDataset, disableSubmit]);

  return (
    <AppModal open={open} onClose={onClose} header={headerConfig} footer={footerConfig}>
      {open && (
        <div className="mt-2 flex flex-col gap-3">
          <FormWrapper title="Dataset name">
            <DatasetNameInput setDatasetName={setDatasetName} datasetName={datasetName} />
          </FormWrapper>

          <FormWrapper title="Datasource">
            <SelectDataSourceDropdown
              setSelectedDatasource={setSelectedDatasource}
              selectedDatasource={selectedDatasource}
            />
          </FormWrapper>
        </div>
      )}
    </AppModal>
  );
});

NewDatasetModal.displayName = 'NewDatasetModal';

const SelectDataSourceDropdown: React.FC<{
  setSelectedDatasource: (id: string) => void;
  selectedDatasource: string | null;
}> = React.memo(({ setSelectedDatasource, selectedDatasource }) => {
  const router = useRouter();
  const dataSourcesList = useDataSourceContextSelector((state) => state.dataSourcesList);
  const initDataSourceList = useDataSourceContextSelector((state) => state.initDataSourceList);

  const selectOptions: SelectProps['options'] = useMemo(() => {
    return dataSourcesList.map((dataSource) => ({
      label: dataSource.name,
      value: dataSource.id
    }));
  }, [dataSourcesList]);

  const selectedOption = useMemo(() => {
    return selectOptions.find((option) => option.value === selectedDatasource);
  }, [selectOptions, selectedDatasource]);

  const onSelect = useMemoizedFn((value: unknown) => {
    setSelectedDatasource(value as string);
  });

  useMount(() => {
    initDataSourceList();
    router.prefetch(
      createBusterRoute({
        route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
        datasetId: ''
      })
    );
  });

  return (
    <Select
      className="w-full"
      options={selectOptions}
      value={selectedOption}
      placeholder="Select datasources that this term pertains to"
      popupMatchSelectWidth={true}
      onChange={onSelect}
    />
  );
});
SelectDataSourceDropdown.displayName = 'SelectDataSourceDropdown';

const DatasetNameInput: React.FC<{
  setDatasetName: (name: string) => void;
  datasetName: string;
}> = React.memo(
  ({ setDatasetName, datasetName }) => {
    return (
      <Input
        autoFocus
        defaultValue={datasetName}
        placeholder="Enter a name for your dataset"
        onChange={(e) => setDatasetName(e.target.value)}
      />
    );
  },
  () => true
);
DatasetNameInput.displayName = 'DatasetNameInput';

const FormWrapper: React.FC<{
  title: string;
  children: React.ReactNode;
}> = React.memo(({ title, children }) => {
  return (
    <div className="grid grid-cols-[minmax(150px,auto)_1fr] gap-4">
      <div>
        <Text>{title}</Text>
      </div>
      <div>{children}</div>
    </div>
  );
});
FormWrapper.displayName = 'FormWrapper';
