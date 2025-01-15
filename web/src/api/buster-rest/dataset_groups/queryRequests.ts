import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import {
  listDatasetGroups,
  deleteDatasetGroup,
  createDatasetGroup,
  getDatasetGroup,
  updateDatasetGroup
} from './requests';
import { updateDatasetDatasetGroups } from '../datasets';
import { useQueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from 'ahooks';
import { LIST_DATASET_GROUPS_QUERY_KEY } from '../datasets/permissions/config';

export const useListDatasetGroups = () => {
  const queryFn = useMemoizedFn(() => listDatasetGroups());
  return useCreateReactQuery({
    queryKey: ['dataset_groups'],
    queryFn
  });
};

export const useDeleteDatasetGroup = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (id: string) => {
    const res = await deleteDatasetGroup(id);
    queryClient.invalidateQueries({ queryKey: ['dataset_groups'] });
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroup = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (data: Parameters<typeof updateDatasetGroup>[0]) => {
    const res = await updateDatasetGroup(data);
    queryClient.invalidateQueries({ queryKey: ['dataset_groups'] });
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetDatasetGroup = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroup(datasetId));
  return useCreateReactQuery({
    queryKey: ['dataset_groups', datasetId],
    queryFn
  });
};

export const useCreateDatasetGroup = (datasetId?: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (data: Parameters<typeof createDatasetGroup>[0]) => {
    const res = await createDatasetGroup(data);
    if (datasetId) {
      await updateDatasetDatasetGroups({
        dataset_id: datasetId,
        groups: [{ id: res.id, assigned: true }]
      });
      queryClient.invalidateQueries({ queryKey: [LIST_DATASET_GROUPS_QUERY_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset_groups'] });
    }
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};
