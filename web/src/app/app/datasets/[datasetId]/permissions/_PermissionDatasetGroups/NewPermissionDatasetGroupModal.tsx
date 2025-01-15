import { AppModal } from '@/components';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { Input, InputRef } from 'antd';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useCreateDatasetGroup } from '@/api/buster-rest/dataset_groups';

interface NewDatasetGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
}

export const NewDatasetGroupModal: React.FC<NewDatasetGroupModalProps> = React.memo(
  ({ isOpen, onClose, datasetId }) => {
    const { mutateAsync, isPending } = useCreateDatasetGroup(datasetId);
    const inputRef = useRef<InputRef>(null);
    const { openInfoMessage } = useBusterNotifications();

    const onCreateNewDatasetGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.input?.value;
      if (!inputValue) {
        openInfoMessage('Please enter a name for the dataset group');
        inputRef.current?.focus();
        return;
      }
      await mutateAsync({
        name: inputValue
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
          loading: isPending
        }
      };
    }, [isPending]);

    useEffect(() => {
      if (isOpen) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }, [isOpen]);

    return (
      <AppModal open={isOpen} onClose={onClose} header={header} footer={footer}>
        <Input ref={inputRef} placeholder="Name of dataset group" />
      </AppModal>
    );
  }
);

NewDatasetGroupModal.displayName = 'NewDatasetGroupModal';
