import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import last from 'lodash/last';
import { create } from 'mutative';
import type { BusterCollection } from '@/api/asset_interfaces/collection';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { getOriginalMetric, setOriginalMetric } from '@/context/Metrics/useOriginalMetricStore';
import { prepareMetricUpdateMetric, upgradeMetricToIMetric } from '@/lib/metrics';
import { dashboardQueryKeys } from '../../query_keys/dashboard';
import { useAddAssetToCollection, useRemoveAssetFromCollection } from '../collections';
import { useGetUserFavorites } from '../users';
import { useGetLatestMetricVersionMemoized } from './metricVersionNumber';
import {
  bulkUpdateMetricVerificationStatus,
  deleteMetrics,
  duplicateMetric,
  shareMetric,
  unshareMetric,
  updateMetric,
  updateMetricShare,
} from './requests';

/**
 * This is a mutation that saves a metric to the server.
 * It will simply use the params passed in and not do any special logic.
 */
export const useSaveMetric = (params?: { updateOnSave?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: updateMetric,
    onMutate: async ({ id, restore_to_version }) => {
      const isRestoringVersion = restore_to_version !== undefined;
      //set the current metric to the previous it is being restored to
      if (isRestoringVersion) {
        const newRestoredMetric = queryClient.getQueryData(
          metricsQueryKeys.metricsGetMetric(id, restore_to_version).queryKey
        );
        const newRestoredMetricData = queryClient.getQueryData(
          metricsQueryKeys.metricsGetData(id, restore_to_version).queryKey
        );
        if (newRestoredMetric && newRestoredMetricData) {
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey,
            newRestoredMetric
          );
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetData(id, 'LATEST').queryKey,
            newRestoredMetricData
          );
        }
      }
    },
    onSuccess: (data) => {
      const oldMetric = queryClient.getQueryData(
        metricsQueryKeys.metricsGetMetric(data.id, 'LATEST').queryKey
      );
      const newMetric = upgradeMetricToIMetric(data, oldMetric || null);
      if (updateOnSave && data) {
        setMetricQueryData(queryClient, newMetric);
      }

      const allDashboardsAssignedToMetric = data.dashboards.map((dashboard) => dashboard.id);
      allDashboardsAssignedToMetric.forEach((dashboardId) => {
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys
            .dashboardGetDashboard(dashboardId, 'LATEST')
            .queryKey.slice(0, 3),
          refetchType: 'all',
        });
      });

      navigate({
        to: '.',
        ignoreBlocker: true,
        search: (prev) => ({ ...prev, metric_version_number: undefined }),
      });
    },
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
    },
  });
};

export const useSaveMetricToCollections = () => {
  const queryClient = useQueryClient();
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();

  const saveMetricToCollection = async ({
    metricIds,
    collectionIds,
  }: {
    metricIds: string[];
    collectionIds: string[];
  }) => {
    await Promise.all(
      collectionIds.map((collectionId) =>
        addAssetToCollection({
          id: collectionId,
          assets: metricIds.map((metricId) => ({ id: metricId, type: 'metric_file' })),
        })
      )
    );
  };

  return useMutation({
    mutationFn: saveMetricToCollection,
    onMutate: ({ metricIds, collectionIds }) => {
      metricIds.forEach((id) => {
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            const newData: BusterMetric = create(oldData, (draft) => {
              // Add new collections, then deduplicate by collection id
              const existingCollections = draft.collections || [];
              const newCollections = collectionIds.map((id) => ({ id, name: '' }));
              // Merge and deduplicate by id
              const merged = [...existingCollections, ...newCollections];
              const deduped = merged.filter(
                (col, idx, arr) => arr.findIndex((c) => c.id === col.id) === idx
              );

              draft.collections = deduped;
            });
            return newData;
          }
        );
      });
    },
    onSuccess: (_, { collectionIds, metricIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey,
        });
      });

      metricIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey,
        });
      });
    },
  });
};

export const useRemoveMetricFromCollection = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();
  const queryClient = useQueryClient();

  const removeMetricFromCollection = async ({
    metricIds,
    collectionIds,
  }: {
    metricIds: string[];
    collectionIds: string[];
  }) => {
    await Promise.all(
      collectionIds.map((collectionId) =>
        removeAssetFromCollection({
          id: collectionId,
          assets: metricIds.map((metricId) => ({ id: metricId, type: 'metric_file' })),
        })
      )
    );
  };

  return useMutation({
    mutationFn: removeMetricFromCollection,
    onMutate: ({ metricIds, collectionIds }) => {
      metricIds.forEach((id) => {
        queryClient.setQueryData(
          metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            const newData: BusterMetric = create(oldData, (draft) => {
              draft.collections = draft.collections?.filter((c) => !collectionIds.includes(c.id));
            });
            return newData;
          }
        );
      });
      collectionIds.forEach((id) => {
        queryClient.setQueryData(
          collectionQueryKeys.collectionsGetCollection(id).queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            const newData: BusterCollection = create(oldData, (draft) => {
              draft.assets = draft.assets?.filter((a) => !metricIds.includes(a.id)) || [];
            });
            return newData;
          }
        );
      });
    },
    onSuccess: (_, { collectionIds, metricIds }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        return collectionIds.includes(f.id);
      });
      if (collectionIsInFavorites) refreshFavoritesList();

      collectionIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey,
        });
      });

      metricIds.forEach((id) => {
        queryClient.invalidateQueries({
          queryKey: metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey,
        });
      });
    },
  });
};

export const useDuplicateMetric = () => {
  return useMutation({
    mutationFn: duplicateMetric,
  });
};

//add a user to a metric
export const useShareMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareMetric,
    onMutate: ({ id, params }) => {
      //THIS MIGHT NOT BE CORRECT AS WE ARE NOT USING THE VERSION NUMBER?
      const queryKey = metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey;

      queryClient.setQueryData(queryKey, (previousData: BusterMetric | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: BusterMetric) => {
          draft.individual_permissions = [
            ...params.map((p) => ({
              ...p,
              name: p.name,
              avatar_url: p.avatar_url || null,
            })),
            ...(draft.individual_permissions || []),
          ].sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (_, variables) => {
      const partialMatchedKey = metricsQueryKeys
        .metricsGetMetric(variables.id, 'LATEST')
        .queryKey.slice(0, -1);
      queryClient.invalidateQueries({
        queryKey: partialMatchedKey,
        refetchType: 'all',
      });
    },
  });
};

//remove a user from a metric
export const useUnshareMetric = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareMetric,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData: BusterMetric | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: BusterMetric) => {
          draft.individual_permissions = (
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || []
          ).sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
  });
};

//update the share settings for a metric
export const useUpdateMetricShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMetricShare,
    onMutate: (variables) => {
      const queryKey = metricsQueryKeys.metricsGetMetric(variables.id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData: BusterMetric | undefined) => {
        if (!previousData) return previousData;
        return create(previousData, (draft: BusterMetric) => {
          draft.individual_permissions = (
            draft.individual_permissions?.map((t) => {
              const found = variables.params.users?.find((v) => v.email === t.email);
              if (found) return { ...t, ...found };
              return t;
            }) || []
          ).sort((a, b) => a.email.localeCompare(b.email));

          if (variables.params.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.params.publicly_accessible;
          }
          if (variables.params.public_password !== undefined) {
            draft.public_password = variables.params.public_password;
          }
          if (variables.params.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.params.public_expiry_date;
          }
          if (variables.params.workspace_sharing !== undefined) {
            draft.workspace_sharing = variables.params.workspace_sharing;
          }
        });
      });
    },
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

  const saveMetricToServer = async (newMetric: BusterMetric, prevMetric: BusterMetric) => {
    const changedValues = prepareMetricUpdateMetric(newMetric, prevMetric); //why do I do this now?
    await saveMetric({ ...changedValues, update_version: updateVersion });
  };

  const combineAndUpdateMetric = ({
    id: metricId,
    ...newMetricPartial
  }: Omit<Partial<BusterMetric>, 'status'> & { id: string }) => {
    const prevMetric = getOriginalMetric(metricId);
    const newMetric = create(prevMetric, (draft) => {
      Object.assign(draft || {}, newMetricPartial);
    });

    if (prevMetric && newMetric) {
      const options = metricsQueryKeys.metricsGetMetric(metricId, 'LATEST');
      queryClient.setQueryData(options.queryKey, newMetric);
    } else {
      console.warn('No previous metric found', { prevMetric, newMetric });
    }

    return { newMetric, prevMetric };
  };

  const mutationFn = async (
    newMetricPartial: Omit<Partial<BusterMetric>, 'status'> & { id: string }
  ) => {
    const { newMetric, prevMetric } = combineAndUpdateMetric(newMetricPartial);

    if (newMetric && prevMetric && saveToServer) {
      return await saveMetricToServer(newMetric, prevMetric);
    }

    return newMetric;
  };

  return useMutation({
    mutationFn,
  });
};

export const useBulkUpdateMetricVerificationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUpdateMetricVerificationStatus,
    onMutate: (variables) => {
      for (const metric of variables) {
        const foundMetric = queryClient.getQueryData<BusterMetric>(
          metricsQueryKeys.metricsGetMetric(metric.id, 'LATEST').queryKey
        );
        if (foundMetric) {
          const newData = create(foundMetric, (draft: BusterMetric) => {
            draft.status = metric.status;
          });
          queryClient.setQueryData(
            metricsQueryKeys.metricsGetMetric(metric.id, 'LATEST').queryKey,
            newData
          );
        }
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: metricsQueryKeys.metricsGetList().queryKey,
        refetchType: 'all',
      });
      for (const metric of data.updated_metrics) {
        const upgradedMetric = upgradeMetricToIMetric(metric, null);
        setMetricQueryData(queryClient, upgradedMetric);
      }
    },
  });
};

const setMetricQueryData = (queryClient: QueryClient, upgradedMetric: BusterMetric) => {
  const id = upgradedMetric.id;
  const versionNumber = upgradedMetric.version_number;

  const isLatestVersion = versionNumber === last(upgradedMetric.versions)?.version_number;
  if (isLatestVersion) {
    queryClient.setQueryData(
      metricsQueryKeys.metricsGetMetric(id, 'LATEST').queryKey,
      upgradedMetric
    );
    setOriginalMetric(upgradedMetric);
  }

  queryClient.setQueryData(
    metricsQueryKeys.metricsGetMetric(id, versionNumber).queryKey,
    upgradedMetric
  );
};
