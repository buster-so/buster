import type { BusterDataset, ListDatasetsResponse } from '@buster/server-shared';
import type { DataResult } from '@buster/server-shared/metrics';
import { queryOptions } from '@tanstack/react-query';
import type { getDatasets } from '../buster_rest/datasets';

const datasetsListQueryOptions = (params?: Parameters<typeof getDatasets>[0]) =>
  queryOptions<ListDatasetsResponse>({
    queryKey: ['datasets', 'list', params],
    initialData: [],
    initialDataUpdatedAt: 0,
  });

const datasetData = (datasetId: string) =>
  queryOptions<DataResult>({
    queryKey: ['datasets', 'data', datasetId],
    staleTime: 60 * 1000 * 10, //10 minute
  });

const datasetMetadata = (datasetId: string) =>
  queryOptions<BusterDataset>({
    queryKey: ['datasets', 'metadata', datasetId],
    staleTime: 10 * 1000,
  });

export const datasetQueryKeys = {
  datasetsListQueryOptions,
  datasetData,
  datasetMetadata,
};
