import React, { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

export const useDatasets = () => {
  return {};
};

const BusterDatasets = createContext<ReturnType<typeof useDatasets>>(
  {} as ReturnType<typeof useDatasets>
);

export const DatasetProviders: React.FC<PropsWithChildren> = ({ children }) => {
  const Datasets = useDatasets();

  return <BusterDatasets.Provider value={Datasets}>{children}</BusterDatasets.Provider>;
};

export const useDatasetContextSelector = <T,>(
  selector: (state: ReturnType<typeof useDatasets>) => T
) => useContextSelector(BusterDatasets, selector);
