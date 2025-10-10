import { Store, useStore } from '@tanstack/react-store';
import { useCallback } from 'react';

export const globalSearchStore = new Store({
  isOpen: false,
  value: '',
});

const stableIsOpen = (x: typeof globalSearchStore.state) => x.isOpen;
const stableValue = (x: typeof globalSearchStore.state) => x.value;
export const useGlobalSearchStore = () => {
  const isOpen = useStore(globalSearchStore, stableIsOpen);
  const value = useStore(globalSearchStore, stableValue);

  const onClose = useCallback(() => {
    toggleGlobalSearch(false);
  }, []);

  return { isOpen, toggleGlobalSearch, onClose, value };
};

export const toggleGlobalSearch = (v?: boolean) => {
  const newState = v ?? !globalSearchStore.state.isOpen;
  globalSearchStore.setState((x) => ({ ...x, isOpen: newState }));
};

export const setGlobalSearchValue = (v: string) => {
  globalSearchStore.setState((x) => ({ ...x, value: v }));
};
