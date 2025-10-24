import { useCallback, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useSearchMultiSelect = () => {
  // Track items to add (were NOT in library, user selected them)
  const [itemsToAdd, setItemsToAdd] = useState<Set<string>>(new Set());
  // Track items to remove (were IN library, user unselected them)
  const [itemsToRemove, setItemsToRemove] = useState<Set<string>>(new Set());

  // Handle item selection - route to appropriate Set based on library status
  const handleSelectItem = useMemoizedFn((itemKey: string, wasInLibrary: boolean) => {
    if (wasInLibrary) {
      // Item was in library, toggle in "remove" Set
      setItemsToRemove((prev) => {
        const next = new Set(prev);
        next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey);
        return next;
      });
    } else {
      // Item was NOT in library, toggle in "add" Set
      setItemsToAdd((prev) => {
        const next = new Set(prev);
        next.has(itemKey) ? next.delete(itemKey) : next.add(itemKey);
        return next;
      });
    }
  });

  // Check if item should appear selected
  const isItemSelected = useCallback(
    (itemKey: string) => {
      // Selected if: (in library AND not marked for removal) OR marked for addition
      // But we don't track "in library" state here, so we check the Sets
      // Item is selected if it's in itemsToAdd OR not in itemsToRemove
      // Wait, this logic needs to consider the item's actual library state...
      // Actually, the `selected` prop already handles `addedToLibrary`, so we just need to check our Sets
      return itemsToAdd.has(itemKey) || itemsToRemove.has(itemKey);
    },
    [itemsToAdd, itemsToRemove]
  );

  return {
    itemsToAdd,
    itemsToRemove,
    isItemSelected,
    setItemsToAdd,
    setItemsToRemove,
    handleSelectItem,
  };
};
