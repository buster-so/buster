import { DataSourceTypes } from '@/api/buster-rest';
import { BusterSocketRequestBase } from '../baseInterfaces';
import { DatasourceCreateCredentials } from './interface';

export type DatasourceListRequest = BusterSocketRequestBase<
  '/data_sources/list',
  {
    page: number;
    page_size: number;
  }
>;

export type DatasourceGetRequest = BusterSocketRequestBase<
  '/data_sources/get',
  {
    id: string;
  }
>;

export type DatasourceDeleteRequest = BusterSocketRequestBase<
  '/data_sources/delete',
  {
    id: string;
  }
>;

export type DatasourcePostRequest = BusterSocketRequestBase<
  '/data_sources/post',
  {
    name: string;
    type: string;
    credentials: DatasourceCreateCredentials;
  }
>;

export type DatasourceUpdateRequest = BusterSocketRequestBase<
  '/data_sources/update',
  {
    id: string;
    name?: string;
    type?: string;
    credentials: DatasourceCreateCredentials;
  }
>;

export type DatasourceEmits =
  | DatasourceListRequest
  | DatasourceGetRequest
  | DatasourcePostRequest
  | DatasourceUpdateRequest
  | DatasourceDeleteRequest;
