import React from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../modal/ModalBase';
import { SearchModalContent } from './SearchModalContent';
import type { SearchModalProps } from './search-modal.types';

const SearchModalBase = <M = unknown, T extends string = string>({
  open,
  onClose,
  className,
  ...props
}: SearchModalProps<M, T>) => {
  console.log(className);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogTitle hidden>{'Search Modal'}</DialogTitle>
      <DialogDescription hidden>{'This modal is used to search for items'}</DialogDescription>
      <DialogContent
        showClose={false}
        className={cn('overflow-hidden max-w-fit max-h-fit', className)}
      >
        <SearchModalContent {...props} open={open} />
      </DialogContent>
    </Dialog>
  );
};

export const SearchModal = React.memo(SearchModalBase);
