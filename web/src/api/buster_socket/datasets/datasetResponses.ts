import { BusterDataset, BusterDatasetListItem } from '@/api/buster_rest/datasets';

export enum DatasetResponses {
  '/datasets/list:listDatasetsAdmin' = '/datasets/list:listDatasetsAdmin',
  '/datasets/list:listDatasets' = '/datasets/list:listDatasets',
  '/datasets/post:postDataset' = '/datasets/post:postDataset',
  '/datasets/delete:deleteDatasets' = '/datasets/delete:deleteDatasets',
  '/datasets/get:getDataset' = '/datasets/get:getDataset',
  '/datasets/update:updateDataset' = '/datasets/update:updateDataset',
  '/datasets/column/update:updateDatasetColumn' = '/datasets/column/update:updateDatasetColumn'
}

export type DatasetResponses_getDatasetsListAdmin = {
  route: '/datasets/list:listDatasetsAdmin';
  callback: (d: BusterDatasetListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type DatasetResponses_getDatasetsList = {
  route: '/datasets/list:listDatasets';
  callback: (d: BusterDatasetListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type DatasetPost_postDataset = {
  route: '/datasets/post:postDataset';
  callback: (d: BusterDataset) => void;
  onError?: (d: unknown) => void;
};

export type DatasetDelete_deleteDataset = {
  route: '/datasets/delete:deleteDatasets';
  callback: (d: unknown) => void;
  onError?: (d: unknown) => void;
};

export type DatasetGet_getDataset = {
  route: '/datasets/get:getDataset';
  callback: (d: BusterDataset) => void;
  onError?: (d: unknown) => void;
};

export type DatasetUpdate_updated_Dataset = {
  route: '/datasets/update:updateDataset';
  callback: (d: BusterDataset) => void;
  onError?: (d: unknown) => void;
};

export type DatasetUpdateColumn_updated_DatasetColumn = {
  route: '/datasets/column/update:updateDatasetColumn';
  callback: (d: BusterDataset) => void;
  onError?: (d: unknown) => void;
};

export type DatasetResponseTypes =
  | DatasetResponses_getDatasetsList
  | DatasetPost_postDataset
  | DatasetDelete_deleteDataset
  | DatasetGet_getDataset
  | DatasetUpdate_updated_Dataset
  | DatasetUpdateColumn_updated_DatasetColumn
  | DatasetResponses_getDatasetsListAdmin;
