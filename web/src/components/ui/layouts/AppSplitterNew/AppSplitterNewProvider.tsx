import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

interface AppSplitterNewProviderProps {
  animateWidth: (width: string | number, side: 'left' | 'right', duration: number) => Promise<void>;
  setSplitSizes: (sizes: [string | number, string | number]) => void;
  isSideClosed: (side: 'left' | 'right') => boolean;
  getSizesInPixels: () => [number, number];
  sizes: [string | number, string | number];
}

const AppSplitterNewContext = createContext<AppSplitterNewProviderProps>({
  animateWidth: async () => {},
  setSplitSizes: () => {},
  isSideClosed: () => false,
  getSizesInPixels: () => [0, 0],
  sizes: ['0', '0']
});

export const AppSplitterNewProvider: React.FC<
  React.PropsWithChildren<AppSplitterNewProviderProps>
> = ({ children, ...props }) => {
  return <AppSplitterNewContext.Provider value={props}>{children}</AppSplitterNewContext.Provider>;
};

export const useAppSplitterNewContext = <T,>(selector: (value: AppSplitterNewProviderProps) => T) =>
  useContextSelector(AppSplitterNewContext, selector);
