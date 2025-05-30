import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

interface AppSplitterProviderProps {
  animateWidth: (width: string | number, side: 'left' | 'right', duration: number) => Promise<void>;
  setSplitSizes: (sizes: [string, string]) => void;
  isSideClosed: (side: 'left' | 'right') => boolean;
  getSizesInPixels: () => [number, number];
  sizes: [string | number, string | number];
}

const AppSplitterContext = createContext<AppSplitterProviderProps>({
  animateWidth: async () => {},
  setSplitSizes: () => {},
  isSideClosed: () => false,
  getSizesInPixels: () => [0, 0],
  sizes: ['0', '0']
});

export const AppSplitterProvider: React.FC<React.PropsWithChildren<AppSplitterProviderProps>> = ({
  children,
  ...props
}) => {
  return <AppSplitterContext.Provider value={props}>{children}</AppSplitterContext.Provider>;
};

export const useAppSplitterContext = <T,>(selector: (value: AppSplitterProviderProps) => T) =>
  useContextSelector(AppSplitterContext, selector);
