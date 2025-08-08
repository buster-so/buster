import { useRouter } from 'next/navigation';
import React, { useLayoutEffect, useMemo } from 'react';
import { useListDatasources } from '@/api/buster_rest/data_source';
import { useCreateDataset } from '@/api/buster_rest/datasets';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { Select, type SelectItem } from '@/components/ui/select';
import { Text } from '@/components/ui/typography';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn, useMount } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';

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
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { mutateAsync: createDataset, isPending: creatingDataset } = useCreateDataset();
  const [selectedDatasource, setSelectedDatasource] = React.useState<string | null>(
    datasourceId || null
  );
  const { refetch: refetchDatasourcesList } = useListDatasources(open);
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
      refetchDatasourcesList();
      setTimeout(() => {
        onClose();
        afterCreate?.();
      }, 150);
    }
  });

  const onAddDataSourceClick = useMemoizedFn(() => {
    onChangePage({ route: BusterRoutes.SETTINGS_DATASOURCES_ADD });
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
  const { data: dataSourcesList } = useListDatasources(false);

  const selectOptions: SelectItem[] = useMemo(() => {
    return (dataSourcesList || []).map((dataSource) => ({
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
      items={selectOptions}
      value={selectedOption?.value}
      placeholder="Select datasources that this term pertains to"
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
}> = ({ title, children }) => {
  return (
    <div className="grid grid-cols-[minmax(150px,auto)_1fr] gap-4">
      <div>
        <Text>{title}</Text>
      </div>
      <div>{children}</div>
    </div>
  );
};
FormWrapper.displayName = 'FormWrapper';
