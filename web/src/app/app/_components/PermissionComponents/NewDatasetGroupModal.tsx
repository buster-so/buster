import { AppModal } from '@/components';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input, InputRef } from 'antd';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useCreateDatasetGroup } from '@/api/buster_rest/dataset_groups';
import { SelectedDatasetInput } from './SelectDatasetInput';

interface NewDatasetGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId?: string | null;
  userId?: string;
}

export const NewDatasetGroupModal: React.FC<NewDatasetGroupModalProps> = React.memo(
  ({ isOpen, onClose, datasetId, userId }) => {
    const [datasetsToAdd, setDatasetsToAdd] = useState<string[]>([]);

    const { mutateAsync, isPending } = useCreateDatasetGroup(datasetId || undefined, userId);
    const inputRef = useRef<InputRef>(null);
    const { openInfoMessage } = useBusterNotifications();

    const onSetDatasetId = useMemoizedFn((datasetIds: string[]) => {
      setDatasetsToAdd(datasetIds);
    });

    const onCreateNewDatasetGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.input?.value;
      if (!inputValue) {
        openInfoMessage('Please enter a name for the dataset group');
        inputRef.current?.focus();
        return;
      }
      await mutateAsync({
        name: inputValue,
        datasetsToAdd
      });
      onClose();
    });

    const header = useMemo(() => {
      return {
        title: 'New dataset group',
        description: 'Create a new dataset group'
      };
    }, []);

    const footer = useMemo(() => {
      return {
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose
        },
        primaryButton: {
          text: 'Create dataset group',
          onClick: onCreateNewDatasetGroup,
          loading: isPending,
          disabled: datasetsToAdd.length === 0
        }
      };
    }, [isPending, datasetsToAdd.length, datasetId]);

    return (
      <AppModal open={isOpen} onClose={onClose} header={header} footer={footer}>
        <div className="flex flex-col gap-2.5">
          <SelectedDatasetInput onSetDatasetId={onSetDatasetId} />
          <Input ref={inputRef} placeholder="Name of dataset group" />
        </div>
      </AppModal>
    );
  }
);

NewDatasetGroupModal.displayName = 'NewDatasetGroupModal';
