import { Store, useStore } from '@tanstack/react-store';

export const librarySearchStore = new Store({
  isOpen: false,
  value: '',
});

const stableIsOpen = (x: typeof librarySearchStore.state) => x.isOpen;
const stableValue = (x: typeof librarySearchStore.state) => x.value;

export const useLibrarySearchStore = () => {
  const isOpen = useStore(librarySearchStore, stableIsOpen);
  const value = useStore(librarySearchStore, stableValue);

  return { isOpen, value, onCloseLibrarySearch, toggleLibrarySearch, setLibrarySearchValue };
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
