'use client';

import isEqual from 'lodash/isEqual';
import { useLayoutEffect, useState, useTransition } from 'react';
import { useDebounceFn } from './useDebounce';
import { useMemoizedFn } from './useMemoizedFn';

interface UseDebounceSearchProps<T> {
  items: T[];
  searchPredicate: (item: T, searchText: string) => boolean;
  debounceTime?: number;
  isFetched?: boolean;
}

export const useDebounceSearch = <T>({
  items,
  searchPredicate,
  debounceTime = 150
}: UseDebounceSearchProps<T>) => {
  const [isPending, startTransition] = useTransition();
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);

  const filterItems = useMemoizedFn((text: string): T[] => {
    if (!text) return items;
    const lowerCaseSearchText = text.toLowerCase();
    return items.filter((item) => searchPredicate(item, lowerCaseSearchText));
  });

  const updateFilteredItems = useMemoizedFn((text: string) => {
    startTransition(() => {
      setFilteredItems(filterItems(text));
    });
  });

  const { run: debouncedSearch } = useDebounceFn(
    (text: string) => {
      updateFilteredItems(text);
    },
    { wait: debounceTime }
  );

  const handleSearchChange = useMemoizedFn((text: string) => {
    setSearchText(text);
    if (!text) {
      updateFilteredItems(text);
    } else {
      debouncedSearch(text);
    }
  });

  useLayoutEffect(() => {
    if (!isEqual(items, filteredItems)) {
      setFilteredItems(items);
    }
  }, [items]);

  return {
    filteredItems,
    searchText,
    handleSearchChange,
    isPending
  };
};
