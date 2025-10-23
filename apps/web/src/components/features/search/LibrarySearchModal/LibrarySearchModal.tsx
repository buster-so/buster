import React, { useState } from 'react';
import { SearchModalBase } from '../SearchModalBase/SearchModalBase';
import { useLibrarySearchStore } from './library-store';

export const LibrarySearchModal = React.memo(() => {
  const { isOpen, onCloseLibrarySearch, value, setLibrarySearchValue } = useLibrarySearchStore();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  return (
    <SearchModalBase
      isOpen={isOpen}
      onClose={onCloseLibrarySearch}
      mode="select-multiple"
      value={value}
      onChangeValue={setLibrarySearchValue}
      items={[]}
      selectedItems={selectedItems}
      loading={true}
      filterContent={null}
      onSelect={setSelectedItems}
    />
  );
});

LibrarySearchModal.displayName = 'LibrarySearchModal';
