import { useDebounceFn, useMemoizedFn } from 'ahooks';
import { useEffect, useState, useTransition } from 'react';

interface UseDebounceSearchProps<T> {
  items: T[];
  searchPredicate: (item: T, searchText: string) => boolean;
}

export const useDebounceSearch = <T>({ items, searchPredicate }: UseDebounceSearchProps<T>) => {
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
    { wait: 200 }
  );

  const handleSearchChange = useMemoizedFn((text: string) => {
    setSearchText(text);
    debouncedSearch(text);
  });

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  return {
    filteredItems,
    searchText,
    handleSearchChange,
    isPending
  };
};
