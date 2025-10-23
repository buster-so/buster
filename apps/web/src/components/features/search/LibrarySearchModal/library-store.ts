import { Store, useStore } from '@tanstack/react-store';

export const librarySearchStore = new Store({
  isOpen: false,
});

const stableIsOpen = (x: typeof librarySearchStore.state) => x.isOpen;
export const useLibrarySearchStore = () => {
  const isOpen = useStore(librarySearchStore, stableIsOpen);

  return { isOpen, onCloseLibrarySearch, toggleLibrarySearch };
};

export const toggleLibrarySearch = (v?: boolean) => {
  const newState = v ?? !librarySearchStore.state.isOpen;
  librarySearchStore.setState((x) => ({ ...x, isOpen: newState }));
};

export const setLibrarySearchValue = (v: string) => {
  librarySearchStore.setState((x) => ({ ...x, value: v }));
};

export const onCloseLibrarySearch = () => {
  toggleLibrarySearch(false);
};
