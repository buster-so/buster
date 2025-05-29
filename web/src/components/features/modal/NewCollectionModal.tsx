'use client';

import { useCreateCollection } from '@/api/buster_rest/collections';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { inputHasText } from '@/lib/text';
import { BusterRoutes } from '@/routes';
import React, { useEffect, useMemo } from 'react';

export const NewCollectionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  useChangePage?: boolean;
  onCollectionCreated?: (collectionId: string) => void;
}> = React.memo(({ onClose, open, useChangePage = true, onCollectionCreated }) => {
  const [title, setTitle] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { mutateAsync: createNewCollection, isPending: isCreatingCollection } =
    useCreateCollection();

  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);

  const disableSubmit = !inputHasText(title);

  const memoizedHeader = useMemo(() => {
    return {
      title: 'New collection',
      description: 'Once created, you will be able to add dashboards and metric to the collection'
    };
  }, []);

  const onCreateNewCollection = useMemoizedFn(async () => {
    if (isCreatingCollection || disableSubmit) return;
    const res = await createNewCollection({ name: title, description: '' });
    if (onCollectionCreated && res) {
      onCollectionCreated(res.id);
    }
    if (useChangePage && res) {
      onChangePage({
        route: BusterRoutes.APP_COLLECTIONS_ID,
        collectionId: res.id
      });
    }
    setTimeout(() => {
      onClose();
    }, 200);
  });

  const memoizedFooter = useMemo(() => {
    return {
      primaryButton: {
        text: 'Create collection',
        onClick: onCreateNewCollection,
        loading: isCreatingCollection,
        disabled: disableSubmit
      }
    };
  }, [isCreatingCollection, disableSubmit]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [open]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <Input
        ref={inputRef}
        placeholder="Collection title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onPressEnter={onCreateNewCollection}
      />
    </AppModal>
  );
});
NewCollectionModal.displayName = 'NewCollectionModal';
