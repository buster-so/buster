import { useCreatePermissionGroup } from '@/api/buster-rest/permission_groups';
import { AppModal } from '@/components/modal';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useMemo, useRef } from 'react';
import { Input, InputRef } from 'antd';
import { useBusterNotifications } from '@/context/BusterNotifications';
interface NewPermissionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string;
}

export const NewPermissionGroupModal: React.FC<NewPermissionGroupModalProps> = React.memo(
  ({ isOpen, onClose, datasetId }) => {
    const { mutateAsync, isPending } = useCreatePermissionGroup();
    const inputRef = useRef<InputRef>(null);
    const { openInfoMessage } = useBusterNotifications();

    const onCreateNewPermissionGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.input?.value;
      if (!inputValue) {
        openInfoMessage('Please enter a name for the permission group');
        inputRef.current?.focus();
        return;
      }
      await mutateAsync({
        name: inputValue,
        dataset_id: datasetId
      });
      onClose();
    });

    const header = useMemo(() => {
      return {
        title: 'New permission group',
        description: 'Create a new permission group'
      };
    }, []);

    const footer = useMemo(() => {
      return {
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose
        },
        primaryButton: {
          text: 'Create permission group',
          onClick: onCreateNewPermissionGroup,
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
        <Input
          ref={inputRef}
          placeholder="Name of permission group"
          autoFocus
          onPressEnter={onCreateNewPermissionGroup}
        />
      </AppModal>
    );
  }
);

NewPermissionGroupModal.displayName = 'NewPermissionGroupModal';
