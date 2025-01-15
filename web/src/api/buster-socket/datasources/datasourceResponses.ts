import { DataSource, DataSourceListItem } from '@/api/buster-rest';

export enum DatasourceResponses {
  '/data_sources/list:listDataSources' = '/data_sources/list:listDataSources',
  '/data_sources/get:getDataSource' = '/data_sources/get:getDataSource',
  '/data_sources/delete:deleteDataSource' = '/data_sources/delete:deleteDataSource'
}

export type DatasourceResponses_getDatasetsList = {
  route: '/data_sources/list:listDataSources';
  callback: (d: DataSourceListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type DatasourceResponses_getDataSource = {
  route: '/data_sources/get:getDataSource';
  callback: (d: DataSource) => void;
  onError?: (d: unknown) => void;
};

export type DatasourceResponses_deleteDataSource = {
  route: '/data_sources/delete:deleteDataSource';
  callback: (d: { id: string }) => void;
  onError?: (d: unknown) => void;
};

export type DatasourceResponseTypes =
  | DatasourceResponses_getDatasetsList
  | DatasourceResponses_getDataSource
  | DatasourceResponses_deleteDataSource;
