import { useMutation, useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import {
  listDatasources,
  getDatasource,
  getDatasource_server,
  deleteDatasource,
  createBigQueryDataSource,
  createDatabricksDataSource,
  createMySQLDataSource,
  createPostgresDataSource,
  createRedshiftDataSource,
  createSnowflakeDataSource,
  createSQLServerDataSource,
  updatePostgresDataSource,
  updateMySQLDataSource,
  updateBigQueryDataSource,
  updateRedshiftDataSource,
  updateSnowflakeDataSource,
  updateDatabricksDataSource,
  updateSQLServerDataSource
} from './requests';
import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { DataSourceTypes } from '@/api/asset_interfaces/datasources/interfaces';
import type {
  BigQueryCreateParams,
  BigQueryUpdateParams,
  DatabricksCreateParams,
  DatabricksUpdateParams,
  MySQLCreateParams,
  MySQLUpdateParams,
  PostgresCreateParams,
  PostgresUpdateParams,
  RedshiftCreateParams,
  RedshiftUpdateParams,
  SnowflakeCreateParams,
  SnowflakeUpdateParams,
  SQLServerCreateParams,
  SQLServerUpdateParams
} from './types';

export const useListDatasources = (enabled = true) => {
  return useQuery({
    ...queryKeys.datasourceGetList,
    queryFn: listDatasources,
    enabled
  });
};

export const useGetDatasource = (id: string | undefined) => {
  return useQuery({
    ...queryKeys.datasourceGet(id!),
    queryFn: () => getDatasource(id!),
    enabled: !!id
  });
};

export const prefetchGetDatasource = async (id: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.datasourceGet(id),
    queryFn: () => getDatasource_server(id)
  });

  return queryClient;
};

export const useDeleteDatasource = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = async (dataSourceId: string) => {
    return openConfirmModal({
      title: 'Delete data source',
      content: 'Are you sure you want to delete this data source?',
      onOk: async () => deleteDatasource(dataSourceId)
    });
  };

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey,
        refetchType: 'all'
      });
    }
  });
};

export const useCreatePostgresDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPostgresDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey,
        refetchType: 'all'
      });
    }
  });
};

export const useUpdatePostgresDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePostgresDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey,
        refetchType: 'all'
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey,
        refetchType: 'all'
      });
    }
  });
};

export const useCreateMySQLDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMySQLDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateMySQLDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMySQLDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey
      });
    }
  });
};

export const useCreateBigQueryDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBigQueryDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateBigQueryDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBigQueryDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey
      });
    }
  });
};

export const useCreateRedshiftDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRedshiftDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateRedshiftDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRedshiftDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey
      });
    }
  });
};

export const useCreateSnowflakeDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSnowflakeDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateSnowflakeDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSnowflakeDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey
      });
    }
  });
};

export const useCreateDatabricksDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDatabricksDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateDatabricksDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDatabricksDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey
      });
    }
  });
};

export const useCreateSQLServerDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSQLServerDataSource,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
    }
  });
};

export const useUpdateSQLServerDataSource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSQLServerDataSource,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGetList.queryKey
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.datasourceGet(variables.id).queryKey
      });
    }
  });
};

// Union type for create datasource parameters
type CreateDatasourceParams =
  | PostgresCreateParams
  | MySQLCreateParams
  | BigQueryCreateParams
  | RedshiftCreateParams
  | SnowflakeCreateParams
  | DatabricksCreateParams
  | SQLServerCreateParams;

// Union type for update datasource parameters
type UpdateDatasourceParams =
  | PostgresUpdateParams
  | MySQLUpdateParams
  | BigQueryUpdateParams
  | RedshiftUpdateParams
  | SnowflakeUpdateParams
  | DatabricksUpdateParams
  | SQLServerUpdateParams;

export const useCreateDatasource = () => {
  const createPostgres = useCreatePostgresDataSource();
  const createMySQL = useCreateMySQLDataSource();
  const createBigQuery = useCreateBigQueryDataSource();
  const createRedshift = useCreateRedshiftDataSource();
  const createSnowflake = useCreateSnowflakeDataSource();
  const createDatabricks = useCreateDatabricksDataSource();
  const createSQLServer = useCreateSQLServerDataSource();

  return {
    mutateAsync: async (credentials: CreateDatasourceParams) => {
      switch (credentials.type) {
        case DataSourceTypes.postgres:
          return createPostgres.mutateAsync(credentials as PostgresCreateParams);
        case DataSourceTypes.mysql:
        case DataSourceTypes.mariadb:
          return createMySQL.mutateAsync(credentials as MySQLCreateParams);
        case DataSourceTypes.bigquery:
          return createBigQuery.mutateAsync(credentials as BigQueryCreateParams);
        case DataSourceTypes.redshift:
          return createRedshift.mutateAsync(credentials as RedshiftCreateParams);
        case DataSourceTypes.snowflake:
          return createSnowflake.mutateAsync(credentials as SnowflakeCreateParams);
        case DataSourceTypes.databricks:
          return createDatabricks.mutateAsync(credentials as DatabricksCreateParams);
        case DataSourceTypes.sqlserver:
          return createSQLServer.mutateAsync(credentials as SQLServerCreateParams);
        default:
          throw new Error(`Unsupported data source type: ${credentials.type}`);
      }
    },
    isLoading:
      createPostgres.isPending ||
      createMySQL.isPending ||
      createBigQuery.isPending ||
      createRedshift.isPending ||
      createSnowflake.isPending ||
      createDatabricks.isPending ||
      createSQLServer.isPending
  };
};

export const useUpdateDatasource = () => {
  const updatePostgres = useUpdatePostgresDataSource();
  const updateMySQL = useUpdateMySQLDataSource();
  const updateBigQuery = useUpdateBigQueryDataSource();
  const updateRedshift = useUpdateRedshiftDataSource();
  const updateSnowflake = useUpdateSnowflakeDataSource();
  const updateDatabricks = useUpdateDatabricksDataSource();
  const updateSQLServer = useUpdateSQLServerDataSource();

  return {
    mutateAsync: async (credentials: UpdateDatasourceParams) => {
      switch (credentials.type as string) {
        case DataSourceTypes.postgres:
        case DataSourceTypes.supabase:
          return updatePostgres.mutateAsync(credentials as PostgresUpdateParams);
        case DataSourceTypes.mysql:
        case DataSourceTypes.mariadb:
          return updateMySQL.mutateAsync(credentials as MySQLUpdateParams);
        case DataSourceTypes.bigquery:
          return updateBigQuery.mutateAsync(credentials as BigQueryUpdateParams);
        case DataSourceTypes.redshift:
          return updateRedshift.mutateAsync(credentials as RedshiftUpdateParams);
        case DataSourceTypes.snowflake:
          return updateSnowflake.mutateAsync(credentials as SnowflakeUpdateParams);
        case DataSourceTypes.databricks:
          return updateDatabricks.mutateAsync(credentials as DatabricksUpdateParams);
        case DataSourceTypes.sqlserver:
          return updateSQLServer.mutateAsync(credentials as SQLServerUpdateParams);
        default:
          throw new Error(`Unsupported data source type: ${credentials.type}`);
      }
    },
    isLoading:
      updatePostgres.isPending ||
      updateMySQL.isPending ||
      updateBigQuery.isPending ||
      updateRedshift.isPending ||
      updateSnowflake.isPending ||
      updateDatabricks.isPending ||
      updateSQLServer.isPending
  };
};
