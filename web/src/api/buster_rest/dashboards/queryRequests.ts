import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  dashboardsGetList,
  dashboardsCreateDashboard,
  dashboardsUpdateDashboard,
  dashboardsDeleteDashboard,
  shareDashboard,
  updateDashboardShare,
  unshareDashboard
} from './requests';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import {
  BusterDashboard,
  BusterDashboardResponse,
  MAX_NUMBER_OF_ITEMS_ON_DASHBOARD
} from '@/api/asset_interfaces/dashboard';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { create } from 'mutative';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { addMetricToDashboardConfig, removeMetricFromDashboardConfig } from './helpers';
import { addAndRemoveMetricsToDashboard } from './helpers/addAndRemoveMetricsToDashboard';
import { RustApiError } from '../errors';
import { useOriginalDashboardStore } from '@/context/Dashboards';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import {
  useGetDashboardAndInitializeMetrics,
  useGetDashboardVersionNumber,
  useEnsureDashboardConfig
} from './dashboardQueryHelpers';
import { useGetLatestMetricVersionMemoized } from '../metrics';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';

export const useGetDashboard = <TData = BusterDashboardResponse>(
  {
    id,
    versionNumber: versionNumberProp
  }: { id: string | undefined; versionNumber?: number | null },
  params?: Omit<
    UseQueryOptions<BusterDashboardResponse, RustApiError, TData>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryFn = useGetDashboardAndInitializeMetrics();
  const setAssetPasswordError = useBusterAssetsContextSelector((x) => x.setAssetPasswordError);
  const { selectedVersionNumber, latestVersionNumber, paramVersionNumber } =
    useGetDashboardVersionNumber({ versionNumber: versionNumberProp });

  const { isFetched: isFetchedInitial, isError: isErrorInitial } = useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id!, null),
    queryFn: () => queryFn(id!, paramVersionNumber),
    enabled: false, //we made this false because we want to be explicit about the fact that we fetch the dashboard server side
    retry(failureCount, error) {
      if (error?.message !== undefined) {
        setAssetPasswordError(id!, error.message || 'An error occurred');
      }
      return false;
    },
    select: undefined,
    ...params
  });

  return useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id!, selectedVersionNumber),
    queryFn: () => queryFn(id!, selectedVersionNumber),
    enabled: !!latestVersionNumber && isFetchedInitial && !isErrorInitial,
    select: params?.select
  });
};

export const usePrefetchGetDashboardClient = () => {
  const queryClient = useQueryClient();
  const queryFn = useGetDashboardAndInitializeMetrics(false);
  return useMemoizedFn((id: string, versionNumber: number) => {
    return queryClient.prefetchQuery({
      ...dashboardQueryKeys.dashboardGetDashboard(id, versionNumber),
      queryFn: () => queryFn(id, versionNumber)
    });
  });
};

export const useSaveDashboard = (params?: { updateOnSave?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const queryClient = useQueryClient();
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);

  return useMutation({
    mutationFn: dashboardsUpdateDashboard,
    onMutate: ({ id, update_version, restore_to_version }) => {
      const isRestoringVersion = restore_to_version !== undefined;
      const isUpdatingVersion = update_version === true;

      //
    },
    onSuccess: (data, variables) => {
      if (updateOnSave && data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
        setOriginalDashboard(data.dashboard);
      }
    }
  });
};

export const useUpdateDashboard = (params?: {
  updateOnSave?: boolean;
  updateVersion?: boolean;
  saveToServer?: boolean;
}) => {
  const { updateOnSave = false, updateVersion = false, saveToServer = false } = params || {};
  const queryClient = useQueryClient();
  const { mutateAsync: saveDashboard } = useSaveDashboard({ updateOnSave });
  const { latestVersionNumber } = useGetDashboardVersionNumber();
  const getOriginalDashboard = useOriginalDashboardStore((x) => x.getOriginalDashboard);

  const mutationFn = useMemoizedFn(
    async (variables: Parameters<typeof dashboardsUpdateDashboard>[0]) => {
      if (saveToServer) {
        return await saveDashboard({
          ...variables,
          update_version: updateVersion
        });
      }
    }
  );

  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      const originalDashboard = getOriginalDashboard(variables.id);
      const updatedDashboard = create(originalDashboard!, (draft) => {
        Object.assign(draft, variables);
      });
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(
        variables.id,
        latestVersionNumber
      ).queryKey;

      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.dashboard = updatedDashboard;
        });
      });
    }
  });
};

export const useUpdateDashboardConfig = () => {
  const { mutateAsync } = useUpdateDashboard({
    saveToServer: false,
    updateVersion: false
  });
  const queryClient = useQueryClient();
  const { latestVersionNumber } = useGetDashboardVersionNumber();

  const method = useMemoizedFn(
    async ({
      dashboardId,
      ...newDashboard
    }: Partial<BusterDashboard['config']> & {
      dashboardId: string;
    }) => {
      const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, latestVersionNumber);
      const previousDashboard = queryClient.getQueryData(options.queryKey);
      const previousConfig = previousDashboard?.dashboard?.config;
      if (previousConfig) {
        const newConfig = create(previousConfig!, (draft) => {
          Object.assign(draft, newDashboard);
        });
        return mutateAsync({
          id: dashboardId,
          config: newConfig
        });
      }
    }
  );

  return useMutation({
    mutationFn: method
  });
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsCreateDashboard,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.dashboardGetList({}).queryKey
        });
      }, 350);
    }
  });
};

export const useDeleteDashboards = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteDashboard = useMemoizedFn(
    async ({
      dashboardId,
      ignoreConfirm
    }: {
      dashboardId: string | string[];
      ignoreConfirm?: boolean;
    }) => {
      const onMutate = () => {
        const queryKey = dashboardQueryKeys.dashboardGetList({}).queryKey;
        queryClient.setQueryData(queryKey, (v) => {
          const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
          return v?.filter((t) => !ids.includes(t.id)) || [];
        });
      };

      const method = async () => {
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        onMutate();
        await dashboardsDeleteDashboard({ ids });
      };
      if (ignoreConfirm) {
        return method();
      }
      return await openConfirmModal({
        title: 'Delete Dashboard',
        content: 'Are you sure you want to delete this dashboard?',
        primaryButtonProps: {
          text: 'Delete'
        },
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: onDeleteDashboard,
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardGetList({}).queryKey
      });
    }
  });
};

export const useAddDashboardToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const mutationFn = useMemoizedFn(
    async (variables: { dashboardIds: string[]; collectionIds: string[] }) => {
      const { dashboardIds, collectionIds } = variables;
      return await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: collectionId,
            assets: dashboardIds.map((dashboardId) => ({ id: dashboardId, type: 'dashboard' }))
          })
        )
      );
    }
  );
  return useMutation({
    mutationFn,
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useRemoveDashboardFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();

  const mutationFn = useMemoizedFn(
    async (variables: { dashboardIds: string[]; collectionIds: string[] }) => {
      const { dashboardIds, collectionIds } = variables;

      return await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: collectionId,
            assets: dashboardIds.map((dashboardId) => ({ id: dashboardId, type: 'dashboard' }))
          })
        )
      );
    }
  );
  return useMutation({
    mutationFn,
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useShareDashboard = () => {
  const queryClient = useQueryClient();
  const { latestVersionNumber } = useGetDashboardVersionNumber();
  return useMutation({
    mutationFn: shareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(
        variables.id,
        latestVersionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions = [
            ...variables.params,
            ...(draft.individual_permissions || [])
          ];
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
          .queryKey,
        data
      );
    }
  });
};

export const useUnshareDashboard = () => {
  const queryClient = useQueryClient();
  const { latestVersionNumber } = useGetDashboardVersionNumber();
  return useMutation({
    mutationFn: unshareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(
        variables.id,
        latestVersionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
          .queryKey,
        data
      );
    }
  });
};

export const useUpdateDashboardShare = () => {
  const queryClient = useQueryClient();
  const { latestVersionNumber } = useGetDashboardVersionNumber();
  return useMutation({
    mutationFn: updateDashboardShare,
    onMutate: ({ id, params }) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(id, latestVersionNumber).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions?.map((t) => {
              const found = params.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (params.publicly_accessible !== undefined) {
            draft.publicly_accessible = params.publicly_accessible;
          }
          if (params.public_password !== undefined) {
            draft.public_password = params.public_password;
          }
          if (params.public_expiry_date !== undefined) {
            draft.public_expiry_date = params.public_expiry_date;
          }
        });
      });
    }
  });
};

export const useAddAndRemoveMetricsFromDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);

  const addAndRemoveMetrics = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      const numberOfItemsOnDashboard: number =
        dashboardResponse?.dashboard.config.rows?.reduce(
          (acc, row) => acc + (row.items?.length || 0),
          0
        ) || 0;

      if (numberOfItemsOnDashboard > MAX_NUMBER_OF_ITEMS_ON_DASHBOARD) {
        openErrorMessage(
          `Dashboard is full, please remove some metrics before adding more. You can only have ${MAX_NUMBER_OF_ITEMS_ON_DASHBOARD} metrics on a dashboard`
        );
        return;
      }

      if (dashboardResponse) {
        const newConfig = addAndRemoveMetricsToDashboard(
          metricIds,
          dashboardResponse.dashboard.config
        );
        return dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig
        });
      }

      openErrorMessage('Failed to save metrics to dashboard');
    }
  );

  return useMutation({
    mutationFn: addAndRemoveMetrics,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
        setOriginalDashboard(data.dashboard);
      }
    }
  });
};

export const useAddMetricsToDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();

  const addMetricToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      if (dashboardResponse) {
        const newConfig = addMetricToDashboardConfig(metricIds, dashboardResponse.dashboard.config);
        return dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig
        });
      }

      openErrorMessage('Failed to save metrics to dashboard');
    }
  );

  return useMutation({
    mutationFn: addMetricToDashboard,
    onMutate: ({ metricIds, dashboardId }) => {
      metricIds.forEach((metricId) => {
        const highestVersion = getLatestMetricVersion(metricId);

        // Update the dashboards array for the highest version metric
        if (highestVersion) {
          const options = metricsQueryKeys.metricsGetMetric(metricId, highestVersion);
          queryClient.setQueryData(options.queryKey, (old) => {
            return create(old!, (draft) => {
              draft.dashboards = [...(draft.dashboards || []), { id: dashboardId, name: '' }];
            });
          });
        }
      });
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );

        Object.values(data.metrics).forEach((metric) => {
          const dashboardId = data.dashboard.id;
          const dashboardName = data.dashboard.name;
          const options = metricsQueryKeys.metricsGetMetric(metric.id, metric.version_number);
          queryClient.setQueryData(options.queryKey, (old) => {
            return create(old!, (draft) => {
              draft.dashboards = [
                ...(draft.dashboards || []),
                { id: dashboardId, name: dashboardName }
              ];
            });
          });
        });

        setOriginalDashboard(data.dashboard);
      }
    }
  });
};

export const useRemoveMetricsFromDashboard = () => {
  const { openConfirmModal, openErrorMessage } = useBusterNotifications();
  const queryClient = useQueryClient();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();

  const removeMetricFromDashboard = useMemoizedFn(
    async ({
      metricIds,
      dashboardId,
      useConfirmModal = true
    }: {
      metricIds: string[];
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const method = async () => {
        metricIds.forEach((metricId) => {
          const highestVersion = getLatestMetricVersion(metricId);
          // Update the dashboards array for the highest version metric
          if (highestVersion) {
            const options = metricsQueryKeys.metricsGetMetric(metricId, highestVersion);
            queryClient.setQueryData(options.queryKey, (old) => {
              return create(old!, (draft) => {
                draft.dashboards = old?.dashboards?.filter((d) => d.id !== dashboardId) || [];
              });
            });
          }
        });

        const dashboardResponse = await ensureDashboardConfig(dashboardId);

        if (dashboardResponse) {
          const versionedOptions = dashboardQueryKeys.dashboardGetDashboard(
            dashboardResponse.dashboard.id,
            dashboardResponse.dashboard.version_number
          );

          const newConfig = removeMetricFromDashboardConfig(
            metricIds,
            dashboardResponse.dashboard.config
          );

          queryClient.setQueryData(versionedOptions.queryKey, (currentDashboard) => {
            return create(currentDashboard!, (draft) => {
              draft.dashboard.config = newConfig;
            });
          });

          const data = await dashboardsUpdateDashboard({
            id: dashboardId,
            config: newConfig
          });

          queryClient.setQueryData(
            dashboardQueryKeys.dashboardGetDashboard(
              data.dashboard.id,
              data.dashboard.version_number
            ).queryKey,
            data
          );
          queryClient.setQueryData(
            dashboardQueryKeys.dashboardGetDashboard(
              data.dashboard.id,
              data.dashboard.version_number
            ).queryKey,
            data
          );
          setOriginalDashboard(data.dashboard);

          return data;
        }

        openErrorMessage('Failed to remove metrics from dashboard');
      };

      if (!useConfirmModal) return await method();

      return await openConfirmModal({
        title: 'Remove from dashboard',
        content:
          metricIds.length > 1
            ? 'Are you sure you want to remove these metrics from the dashboard?'
            : 'Are you sure you want to remove this metric from the dashboard?',
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: removeMetricFromDashboard
  });
};

export const useGetDashboardsList = (
  params: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>,
  options?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof dashboardsGetList>>, RustApiError>,
    'queryKey' | 'queryFn' | 'initialData'
  >
) => {
  const filters = useMemo(() => {
    return {
      ...params,
      page_token: 0,
      page_size: 3000
    };
  }, [params]);

  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(params),
    queryFn: () => dashboardsGetList(filters),
    ...options
  });
};
