import { SearchModal } from '@/components/ui/search/SearchModal';
import type { SearchModalProps } from '@/components/ui/search/SearchModal/search-modal.types';
import { useGlobalSearchStore } from './global-search-store';

export type GlobalSearchModalBaseProps = Pick<
  SearchModalProps,
  'value' | 'searchItems' | 'onChangeValue' | 'onSelect' | 'onViewSearchItem'
>;

export const GlobalSearchModalBase = ({
  value,
  searchItems,
  onChangeValue,
  onSelect,
  onViewSearchItem,
}: GlobalSearchModalBaseProps) => {
  const { isOpen, onClose } = useGlobalSearchStore();

  return (
    <SearchModal
      open={isOpen}
      onClose={onClose}
      value={value}
      searchItems={searchItems}
      onChangeValue={onChangeValue}
      onSelect={onSelect}
      onViewSearchItem={onViewSearchItem}
    />
  );
};
