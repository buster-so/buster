import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { DataSource, DataSourceListItem } from '@/api/buster_rest/datasources';
import { useSelectedLayoutSegments } from 'next/navigation';
import { useMemoizedFn, useMount } from 'ahooks';
import { DatasourceCreateCredentials } from '@/api/buster_socket/datasources/interface';
import { useAppLayoutContextSelector } from '../BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { DatasourceUpdateRequest } from '@/api/buster_socket/datasources/datasourceRequests';
import { useBusterNotifications } from '../BusterNotifications';
import {
  ContextSelector,
  createContext,
  useContextSelector
} from '@fluentui/react-context-selector';

export const useDataSources = () => {
  const { openConfirmModal } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const hasMountedDataSourceList = useRef(false);
  const [dataSourcesList, setDatasourcesList] = useState<DataSourceListItem[]>([]);
  const [loadingDatasources, setLoadingDatasources] = useState(true);
  const segments = useSelectedLayoutSegments();

  const onInitializeDatasourcesList = useMemoizedFn((dataSources: DataSourceListItem[]) => {
    setDatasourcesList(dataSources);
    setLoadingDatasources(false);
  });

  const onUpdateDataSourceListItem = useMemoizedFn((newDatasource: DataSourceListItem) => {
    setDatasourcesList((prevDatasources) => {
      return prevDatasources.map((dataSource) => {
        if (dataSource.id === newDatasource.id) {
          return newDatasource;
        }
        return dataSource;
      });
    });
  });

  const forceInitDataSourceList = useMemoizedFn(() => {
    hasMountedDataSourceList.current = false;
    initDataSourceList();
  });

  const initDataSourceList = useMemoizedFn(() => {
    if (!hasMountedDataSourceList.current) {
      busterSocket.emit({
        route: '/data_sources/list',
        payload: {
          page_size: 1000,
          page: 0
        }
      });
      busterSocket.on({
        route: '/data_sources/list:listDataSources',
        callback: onInitializeDatasourcesList
      });
      hasMountedDataSourceList.current = true;
    }
  });

  useEffect(() => {
    if (segments.includes('datasources')) {
      initDataSourceList();
    }
  }, [segments.length]);

  //DATA SOURCES INDIVIDUAL
  const [datasources, setDatasources] = useState<Record<string, DataSource>>({});
  const dataSourcesSubscribed = useRef<Record<string, boolean>>({});

  const _onInitializeDataSource = useMemoizedFn((dataSource: DataSource) => {
    setDatasources((prevDatasources) => {
      return {
        ...prevDatasources,
        [dataSource.id]: dataSource
      };
    });
  });

  const subscribeToDataSource = useMemoizedFn((datasourceId: string) => {
    const hasDatasource = datasources[datasourceId];

    if (!hasDatasource && !dataSourcesSubscribed.current[datasourceId]) {
      busterSocket.emitAndOnce({
        emitEvent: {
          route: '/data_sources/get',
          payload: {
            id: datasourceId
          }
        },
        responseEvent: {
          route: '/data_sources/get:getDataSource',
          callback: _onInitializeDataSource
        }
      });
      dataSourcesSubscribed.current[datasourceId] = true;
    }
  });

  const onDeleteDataSource = useMemoizedFn(async (dataSourceId: string, goToPage = true) => {
    await openConfirmModal({
      title: 'Delete Data Source',
      content: 'Are you sure you want to delete this data source?',
      onOk: async () => {
        await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/data_sources/delete',
            payload: {
              id: dataSourceId
            }
          },
          responseEvent: {
            route: '/data_sources/delete:deleteDataSource',
            callback: (d) => {
              setDatasources((prevDatasources) => {
                const newDatasources = { ...prevDatasources };
                delete newDatasources[d.id];
                return newDatasources;
              });

              setDatasourcesList((prevDatasources) => {
                return prevDatasources.filter((dataSource) => dataSource.id !== d.id);
              });
            }
          }
        });
      }
    })
      .then(() => {
        if (goToPage) {
          onChangePage({
            route: BusterRoutes.SETTINGS_DATASOURCES
          });
        }
      })
      .catch((error) => {
        //
      });
  });

  const onCreateDataSource = useMemoizedFn(
    async (dataSource: {
      name: string;
      type: string;
      credentials: DatasourceCreateCredentials;
    }) => {
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/data_sources/post',
          payload: dataSource
        },
        responseEvent: {
          route: '/data_sources/get:getDataSource',
          callback: _onInitializeDataSource
        }
      });

      busterSocket.emit({
        route: '/data_sources/list',
        payload: {
          page_size: 1000,
          page: 0
        }
      });

      return res;
    }
  );

  const onUpdateDataSource = useMemoizedFn(
    async (dataSource: DatasourceUpdateRequest['payload']) => {
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/data_sources/update',
          payload: dataSource
        },
        responseEvent: {
          route: '/data_sources/get:getDataSource',
          callback: _onInitializeDataSource
        }
      });
      busterSocket.emit({
        route: '/data_sources/list',
        payload: {
          page_size: 1000,
          page: 0
        }
      });
      return res;
    }
  );

  return {
    datasources,
    forceInitDataSourceList,
    onCreateDataSource,
    onUpdateDataSource,
    onDeleteDataSource,
    dataSourcesList,
    initDataSourceList,
    onUpdateDataSourceListItem,
    loadingDatasources,
    subscribeToDataSource
  };
};

const BusterDataSources = createContext<ReturnType<typeof useDataSources>>(
  {} as ReturnType<typeof useDataSources>
);

export const DataSourceProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const dataSources = useDataSources();

  return <BusterDataSources.Provider value={dataSources}>{children}</BusterDataSources.Provider>;
};

export const useDataSourceContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useDataSources>, T>
) => useContextSelector(BusterDataSources, selector);

export const useDataSourceIndividual = ({ dataSourceId }: { dataSourceId: string }) => {
  const subscribeToDataSource = useDataSourceContextSelector(
    (state) => state.subscribeToDataSource
  );
  const dataSource = useDataSourceContextSelector((state) => state.datasources[dataSourceId]);

  useMount(() => {
    subscribeToDataSource(dataSourceId);
  });

  return { dataSource };
};
