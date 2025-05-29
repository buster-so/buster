import { useCreateDatasetGroup } from '@/api/buster_rest/dataset_groups';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useRef, useState } from 'react';
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
    const inputRef = useRef<HTMLInputElement>(null);
    const { openInfoMessage } = useBusterNotifications();

    const onSetDatasetId = useMemoizedFn((datasetIds: string[]) => {
      setDatasetsToAdd(datasetIds);
    });

    const onCreateNewDatasetGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.value;
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
          <Input ref={inputRef} autoFocus placeholder="Name of dataset group" />
          <SelectedDatasetInput onSetDatasetId={onSetDatasetId} />
        </div>
      </AppModal>
    );
  }
);

NewDatasetGroupModal.displayName = 'NewDatasetGroupModal';
