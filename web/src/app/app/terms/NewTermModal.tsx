import React, { useEffect, useMemo } from 'react';
import { InputRef, Input } from 'antd';
import { useTermsContextSelector } from '@/context/Terms';
import { useDatasetContextSelector } from '@/context/Datasets';
import { AppModal, AppSelectMultiple, Text } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { useGetDatasets } from '@/api/buster_rest/datasets';

export const NewTermModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const titleRef = React.useRef<InputRef>(null);
  const createTerm = useTermsContextSelector((x) => x.createTerm);
  const [creatingTerm, setCreatingTerm] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [definition, setDefinition] = React.useState('');
  const [selectedDatasets, setSelectedDatasets] = React.useState<string[]>([]);

  const disableSubmit = selectedDatasets.length === 0 || !title || !definition;

  const initValues = useMemoizedFn(() => {
    setTitle('');
    setDefinition('');
    setSelectedDatasets([]);
    setCreatingTerm(false);
  });

  const onCreateNewTerm = useMemoizedFn(async () => {
    setCreatingTerm(true);
    await createTerm({
      name: title,
      definition,
      dataset_ids: selectedDatasets
    });

    setTimeout(() => {
      initValues();
    }, 200);

    onClose();
  });

  const onSetDefinition = useMemoizedFn((value: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDefinition(value.target.value);
  });

  const onSetTitle = useMemoizedFn((value: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(value.target.value);
  });

  const memoizedHeader = useMemo(() => {
    return {
      title: 'Create term',
      description: `Define business terms, domain-specific, and more. Any terms and definition you create will be referenced by our LLM features in real-time.`
    };
  }, []);

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Create term',
        onClick: onCreateNewTerm,
        disabled: disableSubmit,
        loading: creatingTerm
      }
    };
  }, [disableSubmit, creatingTerm]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleRef.current?.focus();
      }, 150);
    }
  }, [open]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" type="secondary">
            Term
          </Text>
          <Input placeholder="LTV" value={title} onChange={onSetTitle} />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" type="secondary">
            Definition
          </Text>

          <Input.TextArea
            defaultValue={definition}
            onChange={onSetDefinition}
            autoSize={{ minRows: 3, maxRows: 7 }}
            placeholder="LTV is the total amount of money a customer is expected to spend on a product or service over their lifetime."
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" type="secondary">
            Relevant datasets
          </Text>
          <DatasetListContainer
            selectedDatasets={selectedDatasets}
            setSelectedDatasets={setSelectedDatasets}
          />
        </div>
      </div>
    </AppModal>
  );
});
NewTermModal.displayName = 'NewTermModal';

const DatasetListContainer: React.FC<{
  selectedDatasets: string[];
  setSelectedDatasets: React.Dispatch<React.SetStateAction<string[]>>;
}> = React.memo(({ selectedDatasets, setSelectedDatasets }) => {
  const { data: datasetsList } = useGetDatasets();

  const onChange = useMemoizedFn((v: string[]) => {
    setSelectedDatasets(v);
  });

  const selectOptions = useMemo(
    () =>
      datasetsList.map((item) => ({
        label: item.name,
        value: item.id
      })),
    [datasetsList]
  );

  return (
    <AppSelectMultiple
      loading={datasetsList.length === 0}
      className="w-full"
      placeholder="Select datasets"
      popupMatchSelectWidth
      defaultActiveFirstOption={true}
      options={selectOptions}
      value={selectedDatasets}
      onChange={onChange}
    />
  );
});
DatasetListContainer.displayName = 'DatasetListContainer';
