import type { ListDatasetsQuery } from '@buster/server-shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { datasetQueryKeys } from '@/api/query_keys/datasets';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  createDataset,
  deleteDataset,
  deployDataset,
  getDatasetDataSample,
  getDatasetMetadata,
  getDatasets,
  updateDataset,
} from './requests';

const options = datasetQueryKeys.datasetsListQueryOptions();
const baseDatasetQueryKey = options.queryKey;

export const useGetDatasets = (params?: ListDatasetsQuery) => {
  const queryFn = () => {
    return getDatasets(params);
  };

  return useQuery({
    ...datasetQueryKeys.datasetsListQueryOptions(params),
    queryFn,
    enabled: true,
  });
};

export const prefetchGetDatasets = async (
  queryClient: QueryClient,
  params?: Parameters<typeof getDatasets>[0]
) => {
  await queryClient.prefetchQuery({
    ...datasetQueryKeys.datasetsListQueryOptions(params),
    queryFn: () => getDatasets(params),
  });
  const datasets = queryClient.getQueryData(
    datasetQueryKeys.datasetsListQueryOptions(params).queryKey
  );

  return datasets;
};

export const useGetDatasetData = (datasetId: string | undefined) => {
  const queryFn = () => getDatasetDataSample(datasetId || '');
  return useQuery({
    ...datasetQueryKeys.datasetData(datasetId || ''),
    queryFn,
    enabled: !!datasetId,
  });
};

export const useGetDatasetMetadata = (datasetId: string | undefined) => {
  const queryFn = () => getDatasetMetadata(datasetId || '');
  const res = useQuery({
    ...datasetQueryKeys.datasetMetadata(datasetId || ''),
    queryFn,
    enabled: !!datasetId,
  });
  return res;
};

export const prefetchGetDatasetMetadata = async (datasetId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...datasetQueryKeys.datasetMetadata(datasetId),
    queryFn: () => getDatasetMetadata(datasetId),
  });
  const dataset = queryClient.getQueryData(datasetQueryKeys.datasetMetadata(datasetId).queryKey);
  return { dataset, queryClient };
};

export const useCreateDataset = () => {
  const queryClient = useQueryClient();

  const onSuccess = useMemoizedFn(() => {
    queryClient.invalidateQueries({
      queryKey: baseDatasetQueryKey,
      exact: true,
      refetchType: 'all',
    });
  });

  return useMutation({
    mutationFn: createDataset,
    onSuccess,
  });
};

export const useDeployDataset = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((params: { dataset_id: string; sql: string; yml: string }) =>
    deployDataset(params)
  );

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: baseDatasetQueryKey,
        exact: true,
        refetchType: 'all',
      });
    },
  });
};

export const useUpdateDataset = () => {
  return useMutation({
    mutationFn: updateDataset,
  });
};

export const useDeleteDataset = () => {
  const queryClient = useQueryClient();
  const onSuccess = useMemoizedFn(() => {
    queryClient.invalidateQueries({
      queryKey: baseDatasetQueryKey,
      exact: true,
      refetchType: 'all',
    });
  });
  return useMutation({
    mutationFn: deleteDataset,
    onSuccess,
  });
};

export const useIndividualDataset = ({ datasetId }: { datasetId: string | undefined }) => {
  const dataset = useGetDatasetMetadata(datasetId);
  const datasetData = useGetDatasetData(datasetId);
  return { dataset, datasetData };
};

export const prefetchIndividualDataset = async (datasetId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...datasetQueryKeys.datasetMetadata(datasetId),
    queryFn: () => getDatasetMetadata(datasetId),
  });
  const dataset = queryClient.getQueryData(datasetQueryKeys.datasetMetadata(datasetId).queryKey);
  return { dataset, queryClient };
};
