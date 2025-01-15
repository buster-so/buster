import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import {
  createDataset,
  deployDataset,
  getDatasetDataSample,
  getDatasetMetadata,
  getDatasets,
  updateDataset,
  deleteDataset
} from './requests';
import { BusterDataset, BusterDatasetData, BusterDatasetListItem } from './responseInterfaces';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { getDatasetMetadata_server } from './serverRequests';

export const useGetDatasets = (params?: Parameters<typeof getDatasets>[0]) => {
  const queryFn = useMemoizedFn(() => {
    return getDatasets(params);
  });

  const res = useCreateReactQuery<BusterDatasetListItem[]>({
    queryKey: ['datasets', params || {}],
    queryFn
  });

  return {
    ...res,
    data: res.data || []
  };
};

export const prefetchGetDatasets = async (
  params?: Parameters<typeof getDatasets>[0],
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['datasets', params || {}],
    queryFn: () => getDatasets(params)
  });

  return queryClient;
};

export const useGetDatasetData = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetDataSample(datasetId));
  return useCreateReactQuery<BusterDatasetData>({
    queryKey: ['datasetData', datasetId],
    queryFn,
    enabled: !!datasetId,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 10 // 10 minutes
  });
};

export const useGetDatasetMetadata = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetMetadata(datasetId));
  const res = useCreateReactQuery<BusterDataset>({
    queryKey: ['datasetMetadata', datasetId],
    queryFn,
    enabled: !!datasetId
  });
  return res;
};

export const prefetchGetDatasetMetadata = async (
  datasetId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['datasetMetadata', datasetId],
    queryFn: () => getDatasetMetadata_server(datasetId)
  });
  return queryClient;
};

export const useCreateDataset = () => {
  const queryClient = useQueryClient();

  const onSuccess = useMemoizedFn(() => {
    queryClient.invalidateQueries({ queryKey: ['datasets', {}] });
  });

  return useCreateReactMutation({
    mutationFn: createDataset,
    onSuccess
  });
};

export const useDeployDataset = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((params: { dataset_id: string; sql: string; yml: string }) =>
    deployDataset(params)
  );

  return useCreateReactMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['datasets', {}] });
    }
  });
};

export const useUpdateDataset = () => {
  return useCreateReactMutation({
    mutationFn: updateDataset
  });
};

export const useDeleteDataset = () => {
  const queryClient = useQueryClient();
  const onSuccess = useMemoizedFn(() => {
    queryClient.invalidateQueries({ queryKey: ['datasets', {}] });
  });
  return useCreateReactMutation({
    mutationFn: deleteDataset,
    onSuccess
  });
};
