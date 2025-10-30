import type {
  CreateDataSourceResponse,
  GetDataSourceResponse,
  ListDataSourcesResponse,
  UpdateDataSourceResponse,
} from '@buster/server-shared';
import type {
  BigQueryCredentials,
  DatabricksCredentials,
  MotherDuckCredentials,
  MySQLCredentials,
  PostgreSQLCredentials,
  RedshiftCredentials,
  SnowflakeCredentials,
  SQLServerCredentials,
} from '@/api/asset_interfaces/datasources';
import { mainApiV2 } from '../instances';

export const listDatasources = async () => {
  const response = await mainApiV2.get<ListDataSourcesResponse>('/data-sources');
  // Return just the data array for backward compatibility with UI
  return response.data.data;
};

export const getDatasource = async (id: string) => {
  return await mainApiV2.get<GetDataSourceResponse>(`/data-sources/${id}`).then((res) => res.data);
};

export const deleteDatasource = async (id: string) => {
  return await mainApiV2.delete(`/data-sources/${id}`).then((res) => res.data);
};

export const createPostgresDataSource = async (
  params: PostgreSQLCredentials & { name: string }
) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updatePostgresDataSource = async ({
  id,
  ...params
}: Parameters<typeof createPostgresDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createMySQLDataSource = async (params: MySQLCredentials & { name: string }) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateMySQLDataSource = async ({
  id,
  ...params
}: Parameters<typeof createMySQLDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createRedshiftDataSource = async (params: RedshiftCredentials & { name: string }) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateRedshiftDataSource = async ({
  id,
  ...params
}: Parameters<typeof createRedshiftDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createBigQueryDataSource = async (params: BigQueryCredentials & { name: string }) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateBigQueryDataSource = async ({
  id,
  ...params
}: Parameters<typeof createBigQueryDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createSnowflakeDataSource = async (
  params: SnowflakeCredentials & { name: string }
) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateSnowflakeDataSource = async ({
  id,
  ...params
}: Parameters<typeof createSnowflakeDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createDatabricksDataSource = async (
  params: DatabricksCredentials & { name: string }
) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateDatabricksDataSource = async ({
  id,
  ...params
}: Parameters<typeof createDatabricksDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createSQLServerDataSource = async (
  params: SQLServerCredentials & { name: string }
) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateSQLServerDataSource = async ({
  id,
  ...params
}: Parameters<typeof createSQLServerDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};

export const createMotherDuckDataSource = async (
  params: MotherDuckCredentials & { name: string }
) => {
  return mainApiV2.post<CreateDataSourceResponse>('/data-sources', params).then((res) => res.data);
};

export const updateMotherDuckDataSource = async ({
  id,
  ...params
}: Parameters<typeof createMotherDuckDataSource>[0] & { id: string }) => {
  return mainApiV2
    .put<UpdateDataSourceResponse>(`/data-sources/${id}`, params)
    .then((res) => res.data);
};
