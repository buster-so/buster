import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../../modal/ModalBase';
import { SearchModalContent } from './SearchModalContent';
import type { SearchModalProps } from './search-modal.types';

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, ...props }) => {
  return (
    <Dialog open={open} onOpenChange={(x) => x}>
      <DialogTitle hidden>{'Search Modal'}</DialogTitle>
      <DialogDescription hidden>{'This modal is used to search for items'}</DialogDescription>
      <DialogContent showClose={false} className="overflow-hidden max-w-fit max-h-fit">
        <SearchModalContent {...props} isModalOpen={open} />
      </DialogContent>
    </Dialog>
  );
};
