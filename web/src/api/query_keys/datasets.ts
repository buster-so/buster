import { queryOptions } from '@tanstack/react-query';
import type { BusterDataset, BusterDatasetListItem } from '../asset_interfaces/datasets/interfaces';
import type { IDataResult } from '../asset_interfaces/metric/interfaces';
import { type getDatasets } from '../buster_rest/datasets';

const datasetsListQueryOptions = (params?: Parameters<typeof getDatasets>[0]) =>
  queryOptions<BusterDatasetListItem[]>({
    queryKey: ['datasets', params]
  });

const datasetData = (datasetId: string) =>
  queryOptions<IDataResult>({
    queryKey: ['datasetData', datasetId],
    staleTime: 60 * 1000 * 10 //10 minute
  });

const datasetMetadata = (datasetId: string) =>
  queryOptions<BusterDataset>({
    queryKey: ['datasetMetadata', datasetId],
    staleTime: 10 * 1000
  });

export const datasetQueryKeys = {
  datasetsListQueryOptions,
  datasetData,
  datasetMetadata
};
