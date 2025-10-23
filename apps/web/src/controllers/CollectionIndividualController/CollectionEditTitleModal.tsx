import type { BusterCollection } from '@buster/server-shared/collections';
import React, { useEffect, useMemo, useState } from 'react';
import { useUpdateCollection } from '@/api/buster_rest/collections';
import { Input } from '@/components/ui/inputs';
import { AppModal, type ModalProps } from '@/components/ui/modal';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { inputHasText } from '@/lib/text';

export const CollectionEditTitleModal: React.FC<{
  open: boolean;
  onClose: () => void;
  name: BusterCollection['name'];
  id: BusterCollection['id'];
}> = React.memo(({ open, onClose, name, id }) => {
  const [title, setTitle] = useState(name);
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useUpdateCollection();

  const disableSubmit = useMemo(() => {
    return !inputHasText(title);
  }, [title, name, isUpdatingCollection]);

  const onUpdateCollection = useMemoizedFn(async () => {
    await updateCollection({ id, name });
    onClose();
  });

  const memoizedHeader: ModalProps['header'] = useMemo(() => {
    return {
      title: 'Edit title',
      description: 'Edit the title of the collection',
    };
  }, []);

  const memoizedFooter: ModalProps['footer'] = useMemo(() => {
    return {
      primaryButton: {
        text: 'Save',
        onClick: onUpdateCollection,
        loading: isUpdatingCollection,
        disabled: disableSubmit,
      },
    };
  }, [onUpdateCollection, isUpdatingCollection, disableSubmit]);

  useEffect(() => {
    setTitle(name);
  }, [name]);

  return (
    <AppModal open={open} onClose={onClose} header={memoizedHeader} footer={memoizedFooter}>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
    </AppModal>
  );
});

CollectionEditTitleModal.displayName = 'CollectionEditTitleModal';
