import { useCreatePermissionGroup } from '@/api/buster_rest/permission_groups';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import React, { useMemo, useRef, useState } from 'react';
import { SelectedDatasetInput } from './SelectDatasetInput';

interface NewPermissionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId?: string | null;
  userId?: string;
}

export const NewPermissionGroupModal: React.FC<NewPermissionGroupModalProps> = React.memo(
  ({ isOpen, onClose, datasetId, userId }) => {
    const { mutateAsync, isPending } = useCreatePermissionGroup(userId);
    const inputRef = useRef<HTMLInputElement>(null);
    const [datasetsIdsToAssign, setDatasetsIdsToAssign] = useState<string[]>([]);
    const { openInfoMessage } = useBusterNotifications();

    const onCreateNewPermissionGroup = useMemoizedFn(async () => {
      const inputValue = inputRef.current?.value;
      if (!inputValue || datasetsIdsToAssign.length === 0) {
        openInfoMessage('Please enter a name for the permission group');
        inputRef.current?.focus();
        return;
      }
      await mutateAsync({
        name: inputValue,
        dataset_id: datasetId || undefined,
        datasetsIdsToAssign
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
          loading: isPending,
          disabled: datasetsIdsToAssign.length === 0
        }
      };
    }, [isPending, datasetId, datasetsIdsToAssign.length]);

    return (
      <AppModal open={isOpen} onClose={onClose} header={header} footer={footer}>
        <div className="flex flex-col gap-2.5">
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Name of permission group"
            onPressEnter={onCreateNewPermissionGroup}
          />
          <SelectedDatasetInput onSetDatasetId={setDatasetsIdsToAssign} />
        </div>
      </AppModal>
    );
  }
);

NewPermissionGroupModal.displayName = 'NewPermissionGroupModal';
