'use client';

import { useUpdateCollection } from '@/api/buster_rest/collections';
import type { ButtonProps } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs/Input';
import { AppModal } from '@/components/ui/modal';
import { useMemoizedFn } from '@/hooks';
import React, { useState, useMemo } from 'react';

interface RenameCollectionModalProps {
  collectionId: string;
  currentName: string;
  open: boolean;
  onClose: () => void;
}

export const RenameCollectionModal = React.memo<RenameCollectionModalProps>(
  ({ collectionId, currentName, open, onClose }) => {
    const [newName, setNewName] = useState(currentName);
    const { mutateAsync: updateCollection, isPending } = useUpdateCollection();

    const handleRename = useMemoizedFn(async (e?: React.KeyboardEvent<HTMLInputElement>) => {
      e?.preventDefault();
      if (!newName.trim() || newName.trim() === currentName || isPending) return;
      await updateCollection({
        id: collectionId,
        name: newName
      });
      onClose();
    });

    const isDisabled = useMemo(() => {
      return !newName.trim() || newName.trim() === currentName;
    }, [newName, currentName]);

    const header = useMemo(
      () => ({
        title: 'Rename Collection',
        description: 'Enter a new name for your collection'
      }),
      []
    );

    const footer = useMemo(
      () => ({
        primaryButton: {
          text: 'Rename',
          onClick: handleRename,
          loading: isPending,
          disabled: isDisabled
        },
        secondaryButton: {
          text: 'Cancel',
          onClick: onClose,
          variant: 'ghost' as ButtonProps['variant']
        }
      }),
      [handleRename, isPending, isDisabled, onClose]
    );

    return (
      <AppModal open={open} onClose={onClose} header={header} footer={footer}>
        <Input
          value={newName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
          onPressEnter={handleRename}
          placeholder="Enter collection name"
          autoFocus
        />
      </AppModal>
    );
  }
);

RenameCollectionModal.displayName = 'RenameCollectionModal';
