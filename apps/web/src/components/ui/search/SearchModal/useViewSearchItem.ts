import { useEffect, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import type { SearchItem, SearchItems } from './search-modal.types';

export const useViewSearchItem = <M, T extends string>({
  searchItems,
  onViewSearchItem,
}: {
  searchItems: SearchItems<M, T>[];
  onViewSearchItem: (item: SearchItem<M, T>) => void;
}) => {
  const [focusedValue, setFocusedValue] = useState<string>('');

  const findAndViewSearchItem = useMemoizedFn(() => {
    if (!onViewSearchItem) return;

    // Wait for next tick to get updated focusedValue
    setTimeout(() => {
      if (!focusedValue) return;

      const findItem = (items: typeof searchItems): SearchItem<M, T> | null => {
        for (const item of items) {
          if (item.type === 'item' && item.value === focusedValue) {
            return item;
          }
          if (item.type === 'group') {
            const found = findItem(item.items);
            if (found) return found;
          }
        }
        return null;
      };

      const item = findItem(searchItems);
      if (item) {
        onViewSearchItem(item);
      }
    }, 0);
  });

  // const handleKeyDown = (e: React.KeyboardEvent) => {
  //   if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
  //     findAndViewSearchItem();
  //   }
  // };

  useEffect(() => {
    findAndViewSearchItem();
  }, [focusedValue]);

  return {
    // handleKeyDown,
    focusedValue,
    setFocusedValue,
  };
};
