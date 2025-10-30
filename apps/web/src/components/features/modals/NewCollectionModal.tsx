import { useNavigate } from '@tanstack/react-router';
import React, { useEffect, useMemo } from 'react';
import { useCreateCollection } from '@/api/buster_rest/collections';
import { Input } from '@/components/ui/inputs';
import { AppModal } from '@/components/ui/modal';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { inputHasText } from '@/lib/text';

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
  const navigate = useNavigate();

  const disableSubmit = !inputHasText(title);

  const memoizedHeader = useMemo(() => {
    return {
      title: 'New collection',
      description: 'Once created, you will be able to add dashboards and metric to the collection',
    };
  }, []);

  const onCreateNewCollection = useMemoizedFn(async () => {
    if (isCreatingCollection || disableSubmit) return;
    const res = await createNewCollection({ name: title, description: '' });
    if (onCollectionCreated && res) {
      onCollectionCreated(res.id);
    }
    if (useChangePage && res) {
      navigate({
        to: '/app/collections/$collectionId',
        params: {
          collectionId: res.id,
        },
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
        disabled: disableSubmit,
      },
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
