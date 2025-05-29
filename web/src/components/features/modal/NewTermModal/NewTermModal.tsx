import React, { useEffect, useMemo, useState } from 'react';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { useCreateTerm } from '@/api/buster_rest/terms';
import { Input } from '@/components/ui/inputs/Input';
import { InputTextArea } from '@/components/ui/inputs/InputTextArea';
import { AppModal } from '@/components/ui/modal';
import type { SelectItem } from '@/components/ui/select';
import { SelectMultiple } from '@/components/ui/select/SelectMultiple';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';

export const NewTermModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = React.memo(({ open, onClose }) => {
  const titleRef = React.useRef<HTMLInputElement>(null);
  const { mutateAsync: createTerm, isPending: isCreatingTerm } = useCreateTerm();
  const [title, setTitle] = useState('');
  const [definition, setDefinition] = useState('');
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);

  const disableSubmit = selectedDatasets.length === 0 || !title || !definition;

  const initValues = useMemoizedFn(() => {
    setTitle('');
    setDefinition('');
    setSelectedDatasets([]);
  });

  const onCreateNewTerm = useMemoizedFn(async () => {
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
      description:
        'Define business terms, domain-specific, and more. Any terms and definition you create will be referenced by our LLM features in real-time.'
    };
  }, []);

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Create term',
        onClick: onCreateNewTerm,
        disabled: disableSubmit,
        loading: isCreatingTerm
      }
    };
  }, [disableSubmit, isCreatingTerm]);

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
          <Text size="sm" variant="secondary">
            Term
          </Text>
          <Input placeholder="LTV" value={title} onChange={onSetTitle} />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" variant="secondary">
            Definition
          </Text>

          <InputTextArea
            defaultValue={definition}
            onChange={onSetDefinition}
            autoResize={{ minRows: 3, maxRows: 7 }}
            placeholder="LTV is the total amount of money a customer is expected to spend on a product or service over their lifetime."
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Text size="sm" variant="secondary">
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
  const { data: datasetsList, isLoading, isFetched } = useGetDatasets();

  const onChange = useMemoizedFn((v: string[]) => {
    setSelectedDatasets(v);
  });

  const selectOptions: SelectItem[] = useMemo(
    () =>
      datasetsList.map((item) => ({
        label: item.name,
        value: item.id
      })),
    [datasetsList]
  );

  return (
    <SelectMultiple
      items={selectOptions}
      disabled={!isFetched}
      onChange={onChange}
      placeholder="Select a dataset"
      value={selectedDatasets}
    />
  );

  // return (
  //   <AppSelectMultiple
  //     loading={datasetsList.length === 0}
  //     className="w-full"
  //     placeholder="Select datasets"
  //     popupMatchSelectWidth
  //     defaultActiveFirstOption={true}
  //     options={selectOptions}
  //     value={selectedDatasets}
  //     onChange={onChange}
  //   />
  // );
});
DatasetListContainer.displayName = 'DatasetListContainer';
