import { createContext, useContextSelector } from 'use-context-selector';
import React from 'react';
import { useDatasourceCreate } from './useDatasourceCreate';
import { useDatasourceUpdate } from './useDatasourceUpdate';

export const useDataSourceIndividualProvider = () => {
  const datasourceCreate = useDatasourceCreate();
  const datasourceUpdate = useDatasourceUpdate();
  return {
    ...datasourceCreate,
    ...datasourceUpdate
  };
};

const DataSourceIndividualContext = createContext<
  ReturnType<typeof useDataSourceIndividualProvider>
>({} as ReturnType<typeof useDataSourceIndividualProvider>);

const DataSourceIndividualProvider = ({ children }: { children: React.ReactNode }) => {
  const dataSourceParams = useDataSourceIndividualProvider();

  return (
    <DataSourceIndividualContext.Provider value={dataSourceParams}>
      {children}
    </DataSourceIndividualContext.Provider>
  );
};

export { DataSourceIndividualProvider };

export const useDataSourceIndividualContextSelector = <T,>(
  selector: (state: ReturnType<typeof useDataSourceIndividualProvider>) => T
) => useContextSelector(DataSourceIndividualContext, selector);
