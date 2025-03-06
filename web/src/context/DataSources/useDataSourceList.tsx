import React from 'react';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import { createContext, useContextSelector } from 'use-context-selector';

export const useDataSourceList = () => {
  const {
    data: dataSourcesList,
    isFetched: isFetchedDatasourcesList,
    refetch: refetchDatasourcesList
  } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/data_sources/list',
      payload: {
        page_size: 1000,
        page: 0
      }
    },
    responseEvent: '/data_sources/list:listDataSources',
    options: queryKeys.datasourceGetList
  });

  return {
    dataSourcesList,
    isFetchedDatasourcesList,
    refetchDatasourcesList
  };
};

const DataSourceListContext = createContext<ReturnType<typeof useDataSourceList>>(
  {} as ReturnType<typeof useDataSourceList>
);

export const DataSourceListProvider = ({ children }: { children: React.ReactNode }) => {
  const { dataSourcesList, isFetchedDatasourcesList, refetchDatasourcesList } = useDataSourceList();

  return (
    <DataSourceListContext.Provider
      value={{ dataSourcesList, isFetchedDatasourcesList, refetchDatasourcesList }}>
      {children}
    </DataSourceListContext.Provider>
  );
};

export const useDataSourceListContextSelector = <T,>(
  selector: (state: ReturnType<typeof useDataSourceList>) => T
) => useContextSelector(DataSourceListContext, selector);
