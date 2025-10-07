import type { SearchTextData, SearchTextResponse } from '@buster/server-shared/search';
import { useMemo, useState } from 'react';
import { SearchModal } from '@/components/ui/search/SearchModal';
import type {
  SearchItem,
  SearchItems,
  SearchModalProps,
} from '@/components/ui/search/SearchModal/search-modal.types';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { GlobalSearchSecondaryContent } from './GlobalSearchSecondaryContent';
import { useGlobalSearchStore } from './global-search-store';

export type GlobalSearchModalBaseProps<M = unknown, T extends string = string> = Pick<
  NonNullable<SearchModalProps<M, T>>,
  'value' | 'onChangeValue' | 'onSelect' | 'loading' | 'scrollContainerRef' | 'openSecondaryContent'
> & {
  items: SearchTextResponse['data'];
};

export const GlobalSearchModalBase = ({
  value,
  items,
  onChangeValue,
  onSelect,
  loading,
  openSecondaryContent,
  scrollContainerRef,
}: GlobalSearchModalBaseProps) => {
  const { isOpen, onClose } = useGlobalSearchStore();
  const [viewedItem, setViewedItem] = useState<SearchTextData | null>(null);

  const searchItems: SearchItems[] = useMemo(
    () =>
      items.map((item) => ({
        label: item.title,
        value: item.assetId,
        type: 'item',
      })),
    [items]
  );

  const onViewSearchItem = useMemoizedFn((item: SearchItem) => {
    const foundItem = items.find((x) => x.assetId === item.value);
    setViewedItem(foundItem ?? null);
  });

  return (
    <SearchModal
      open={isOpen}
      onClose={onClose}
      value={value}
      searchItems={searchItems}
      onChangeValue={onChangeValue}
      onSelect={onSelect}
      onViewSearchItem={onViewSearchItem}
      secondaryContent={useMemo(() => {
        return viewedItem ? <GlobalSearchSecondaryContent selectedItem={viewedItem} /> : null;
      }, [viewedItem])}
      placeholder="Search..."
      loading={loading}
      showTopLoading={false}
      scrollContainerRef={scrollContainerRef}
      openSecondaryContent={openSecondaryContent}
    />
  );
};
