import { useOriginalMetricStore } from '@/context/Metrics/useOriginalMetricStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useGetLatestMetricVersionMemoized,
  useGetMetricVersionNumber,
  useMetricQueryStore
} from './metricQueryStore';
import {
  bulkUpdateMetricVerificationStatus,
  deleteMetrics,
  duplicateMetric,
  shareMetric,
  unshareMetric,
  updateMetric,
  updateMetricShare
} from './requests';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { useGetUserFavorites } from '../users';
import { useMemoizedFn } from '@/hooks';
import { useAddAssetToCollection, useRemoveAssetFromCollection } from '../collections';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { create } from 'mutative';
import { prepareMetricUpdateMetric, upgradeMetricToIMetric } from '@/lib/metrics';

/**
 * This is a mutation that saves a metric to the server.
 * It will simply use the params passed in and not do any special logic.
 */
export const useSaveMetric = (params?: { updateOnSave?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const onSetLatestMetricVersion = useMetricQueryStore((x) => x.onSetLatestMetricVersion);
  const queryClient = useQueryClient();
  const setOriginalMetric = useOriginalMetricStore((x) => x.setOriginalMetric);
  const getOriginalMetric = useOriginalMetricStore((x) => x.getOriginalMetric);
  const { latestVersionNumber } = useGetMetricVersionNumber();

  return useMutation({
    mutationFn: updateMetric,
    onMutate: async ({ id, update_version, restore_to_version }) => {
      const isRestoringVersion = restore_to_version !== undefined;
      const isUpdatingVersion = update_version === true;
      //set the current metric to the previous it is being restored to
      if (isRestoringVersion) {
        const oldMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, latestVersionNumber).queryKey
        );
        const newMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, restore_to_version).queryKey
        );
        const newMetricData = queryClient.getQueryData(
          metricsQueryKeys.metricsGetData(id, restore_to_version).queryKey
        );
        if (oldMetric && newMetric && newMetricData) {
          const newVersionNumber = (latestVersionNumber || 0) + 1;
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(id, newVersionNumber).queryKey,
            oldMetric
          );
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetData(id, newVersionNumber).queryKey,
            newMetricData
          );
        }
      }

      if (isUpdatingVersion) {
        const metric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, latestVersionNumber).queryKey
        );
        if (!metric) return;
        const metricVersionNumber = metric?.version_number;
        const metricData = queryClient.getQueryData(
          metricsQueryKeys.metricsGetData(id, metricVersionNumber).queryKey
        );
        const newVersionNumber = (metricVersionNumber ?? 0) + 1;

        if (metricData) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetData(id, newVersionNumber).queryKey,
            metricData
          );
        }
      }
    },
    onSuccess: (data, variables) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, latestVersionNumber).queryKey
      );
      const newMetric = upgradeMetricToIMetric(data, oldMetric || null);
      if (updateOnSave && data) {
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
          newMetric
        );
      }

      onSetLatestMetricVersion(data.id, data.version_number);

      if (variables.update_version || variables.restore_to_version) {
        const initialOptions = metricsQueryKeys.metricsGetMetric(data.id, null);
        const initialMetric = queryClient.getQueryData(initialOptions.queryKey);
        if (initialMetric) {
          queryClient.setQueryData(
            initialOptions.queryKey,
            create(initialMetric, (draft) => {
              draft.versions = data.versions;
            })
          );
        }

        const originalMetric = getOriginalMetric(data.id);
        if (originalMetric) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(data.id, oldMetric?.version_number || null).queryKey,
            originalMetric
          );
        }
      }

      setOriginalMetric(newMetric);
    }
  });
};

export const useDeleteMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMetrics,
    onMutate: async (variables) => {
      const metricIds = variables.ids;
      const options = metricsQueryKeys.metricsGetList();
      queryClient.setQueryData(options.queryKey, (oldData) => {
        return oldData?.filter((metric) => !metricIds.includes(metric.id));
      });
    }
  });
};

export const useSaveMetricToCollections = () => {
  const queryClient = useQueryClient();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricIds, collectionIds }: { metricIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: collectionId,
            assets: metricIds.map((metricId) => ({ id: metricId, type: 'metric' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: saveMetricToCollection,
    onSuccess: (_, { collectionIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all'
      });
    }
  });
};

export const useRemoveMetricFromCollection = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const queryClient = useQueryClient();

  const removeMetricFromCollection = useMemoizedFn(
    async ({ metricIds, collectionIds }: { metricIds: string[]; collectionIds: string[] }) => {
      await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: collectionId,
            assets: metricIds.map((metricId) => ({ id: metricId, type: 'metric' }))
          })
        )
      );
    }
  );

  return useMutation({
    mutationFn: removeMetricFromCollection,
    onSuccess: (_, { collectionIds, metricIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all'
      });
    }
  });
};

export const useDuplicateMetric = () => {
  return useMutation({
    mutationFn: duplicateMetric
  });
};

//add a user to a metric
export const useShareMetric = () => {
  const queryClient = useQueryClient();
  const { selectedVersionNumber } = useGetMetricVersionNumber();
  return useMutation({
    mutationFn: shareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(
        variables.id,
        selectedVersionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: IBusterMetric) => {
          draft.individual_permissions = [
            ...variables.params,
            ...(draft.individual_permissions || [])
          ];
        });
      });
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(data, oldMetric || null);

      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
        upgradedMetric
      );
    }
  });
};

//remove a user from a metric
export const useUnshareMetric = () => {
  const queryClient = useQueryClient();
  const { selectedVersionNumber } = useGetMetricVersionNumber();
  return useMutation({
    mutationFn: unshareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(
        variables.id,
        selectedVersionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: IBusterMetric) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(data, oldMetric || null);
      queryClient.setQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, data.version_number).queryKey,
        upgradedMetric
      );
    }
  });
};

//update the share settings for a metric
export const useUpdateMetricShare = () => {
  const queryClient = useQueryClient();
  const { selectedVersionNumber } = useGetMetricVersionNumber();

  return useMutation({
    mutationFn: updateMetricShare,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(
        variables.id,
        selectedVersionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData: IBusterMetric | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: IBusterMetric) => {
          draft.individual_permissions =
            draft.individual_permissions?.map((t) => {
              const found = variables.params.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (variables.params.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.params.publicly_accessible;
          }
          if (variables.params.public_password !== undefined) {
            draft.public_password = variables.params.public_password;
          }
          if (variables.params.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.params.public_expiry_date;
          }
        });
      });
    }
  });
};

export const useUpdateMetric = (params: {
  updateOnSave?: boolean;
  updateVersion?: boolean;
  saveToServer?: boolean;
}) => {
  const { updateOnSave = false, updateVersion = false, saveToServer = false } = params || {};
  const queryClient = useQueryClient();
  const { mutateAsync: saveMetric } = useSaveMetric({ updateOnSave });
  const getOriginalMetric = useOriginalMetricStore((x) => x.getOriginalMetric);
  const { selectedVersionNumber } = useGetMetricVersionNumber();

  const saveMetricToServer = useMemoizedFn(
    async (newMetric: IBusterMetric, prevMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric);
      if (changedValues) {
        await saveMetric({ ...changedValues, update_version: updateVersion });
      }
    }
  );

  const combineAndSaveMetric = useMemoizedFn(
    ({
      id: metricId,
      ...newMetricPartial
    }: Omit<Partial<IBusterMetric>, 'status'> & { id: string }) => {
      const options = metricsQueryKeys.metricsGetMetric(metricId, selectedVersionNumber);
      const prevMetric = getOriginalMetric(metricId);
      const newMetric = create(prevMetric, (draft) => {
        Object.assign(draft || {}, newMetricPartial);
      });

      if (prevMetric && newMetric) {
        queryClient.setQueryData(options.queryKey, newMetric);
      }

      return { newMetric, prevMetric };
    }
  );

  const mutationFn = useMemoizedFn(
    async (newMetricPartial: Omit<Partial<IBusterMetric>, 'status'> & { id: string }) => {
      const { newMetric, prevMetric } = combineAndSaveMetric(newMetricPartial);

      if (newMetric && prevMetric && saveToServer) {
        return await saveMetricToServer(newMetric, prevMetric);
      }

      if (newMetric) {
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(newMetric.id, newMetric.version_number).queryKey,
          newMetric
        );
      }

      return newMetric;
    }
  );

  return useMutation({
    mutationFn
  });
};

export const useBulkUpdateMetricVerificationStatus = () => {
  const queryClient = useQueryClient();
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();
  return useMutation({
    mutationFn: bulkUpdateMetricVerificationStatus,
    onMutate: (variables) => {
      for (const metric of variables) {
        const latestVersionNumber = getLatestMetricVersion(metric.id);
        const foundMetric = queryClient.getQueryData<IBusterMetric>(
          metricsQueryKeys.metricsGetMetric(metric.id, latestVersionNumber).queryKey
        );
        if (foundMetric) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(metric.id, latestVersionNumber).queryKey,
            create(foundMetric, (draft: IBusterMetric) => {
              draft.status = metric.status;
            })
          );
        }
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: metricsQueryKeys.metricsGetList().queryKey,
        refetchType: 'all'
      });
      for (const metric of data.updated_metrics) {
        const oldMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey
        );
        const upgradedMetric = upgradeMetricToIMetric(metric, oldMetric || null);
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
          upgradedMetric
        );
      }
    }
  });
};
