import { Store, useStore } from '@tanstack/react-store';

export const collectionSearchStore = new Store({
  isOpen: false,
});

const stableIsOpen = (x: typeof collectionSearchStore.state) => x.isOpen;
export const useCollectionSearchStore = () => {
  const isOpen = useStore(collectionSearchStore, stableIsOpen);

  return { isOpen, onCloseCollectionSearch, toggleCollectionSearch };
};

export const toggleCollectionSearch = (v?: boolean) => {
  const newState = v ?? !collectionSearchStore.state.isOpen;
  collectionSearchStore.setState((x) => ({ ...x, isOpen: newState }));
};

export const setCollectionSearchValue = (v: string) => {
  collectionSearchStore.setState((x) => ({ ...x, value: v }));
};

export const onCloseCollectionSearch = () => {
  toggleCollectionSearch(false);
};
