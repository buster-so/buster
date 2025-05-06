import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions
} from '@tanstack/react-query';
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
  useEnsureDashboardConfig
} from './dashboardQueryHelpers';
import { useDashboardQueryStore, useGetDashboardVersionNumber } from './dashboardQueryStore';
import { useGetLatestMetricVersionMemoized } from '../metrics';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import last from 'lodash/last';
import { createDashboardFullConfirmModal } from './confirmModals';
import { isQueryStale } from '@/lib';

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
  const onSetLatestDashboardVersion = useDashboardQueryStore((x) => x.onSetLatestDashboardVersion);

  return useMutation({
    mutationFn: dashboardsUpdateDashboard,
    onSuccess: (data, variables) => {
      if (updateOnSave && data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
        setOriginalDashboard(data.dashboard);
        if (variables.update_version) {
          onSetLatestDashboardVersion(data.dashboard.id, last(data.versions)?.version_number || 0);
        }
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
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const setLatestDashboardVersion = useDashboardQueryStore((x) => x.onSetLatestDashboardVersion);
  return useMutation({
    mutationFn: dashboardsCreateDashboard,
    onSuccess: (originalData, variables) => {
      const data = create(originalData, (draft) => {
        draft.dashboard.name = variables.name || originalData.dashboard.name;
      });
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
          .queryKey,
        data
      );
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, null).queryKey,
        data
      );
      setOriginalDashboard(data.dashboard);
      setLatestDashboardVersion(data.dashboard.id, data.dashboard.version_number);
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.dashboardGetList().queryKey,
          refetchType: 'all'
        });
      }, 550);
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
        const queryKey = dashboardQueryKeys.dashboardGetList().queryKey;
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
        queryKey: dashboardQueryKeys.dashboardGetList().queryKey,
        refetchType: 'all'
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
        ),
        refetchType: 'all'
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
        ),
        refetchType: 'all'
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
      // queryClient.setQueryData(
      //   dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
      //     .queryKey,
      //   data
      // );
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
      //
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
  const { openErrorMessage, openConfirmModal } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const setLatestDashboardVersion = useDashboardQueryStore((x) => x.onSetLatestDashboardVersion);

  const addAndRemoveMetrics = useMemoizedFn(
    async ({
      metrics,
      dashboardId
    }: {
      metrics: { id: string; name: string }[];
      dashboardId: string;
    }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      if (dashboardResponse) {
        // Get all existing metric IDs from the dashboard
        const existingMetricIds = new Set(
          dashboardResponse.dashboard.config.rows?.flatMap((row) =>
            row.items.map((item) => item.id)
          ) || []
        );

        // Determine which metrics to add and remove
        const metricsToAdd = metrics.filter((metric) => !existingMetricIds.has(metric.id));
        const metricsToRemove = Array.from(existingMetricIds).filter(
          (id) => !metrics.some((metric) => metric.id === id)
        );

        // Calculate how many metrics we can add while staying under the limit
        const currentMetricCount = existingMetricIds.size - metricsToRemove.length;
        const availableSlots = MAX_NUMBER_OF_ITEMS_ON_DASHBOARD - currentMetricCount;
        const metricsToActuallyAdd = metricsToAdd.slice(0, availableSlots);

        const addMethod = async () => {
          // Create the final list of metrics to include
          const finalMetricIds = [
            ...Array.from(existingMetricIds).filter((id) => !metricsToRemove.includes(id)),
            ...metricsToActuallyAdd.map((metric) => metric.id)
          ];

          let newConfig = addAndRemoveMetricsToDashboard(
            finalMetricIds,
            dashboardResponse.dashboard.config
          );

          const data = await dashboardsUpdateDashboard({
            id: dashboardId,
            config: newConfig
          });

          return data;
        };

        if (metricsToAdd.length > availableSlots) {
          if (availableSlots === 0) {
            return openConfirmModal({
              title: 'Dashboard is full',
              content: `The dashboard is full, please remove some metrics before adding more. You can only have ${MAX_NUMBER_OF_ITEMS_ON_DASHBOARD} metrics on a dashboard at a time.`,
              primaryButtonProps: {
                text: 'Okay'
              },
              cancelButtonProps: {
                hide: true
              },
              onOk: () => {}
            });
          }

          const content = createDashboardFullConfirmModal({
            availableSlots,
            metricsToActuallyAdd: metricsToActuallyAdd,
            metricsToAdd: metricsToAdd
          });

          return openConfirmModal<BusterDashboardResponse>({
            title: 'Dashboard is full',
            content,
            primaryButtonProps: {
              text: 'Okay'
            },
            onOk: async () => {
              return await addMethod();
            }
          });
        }

        return await addMethod();
      }

      openErrorMessage('Failed to save metrics to dashboard');
      return;
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
        setLatestDashboardVersion(data.dashboard.id, data.dashboard.version_number);
      }
    }
  });
};

export const useAddMetricsToDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage, openConfirmModal } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const getLatestMetricVersion = useGetLatestMetricVersionMemoized();
  const setLatestDashboardVersion = useDashboardQueryStore((x) => x.onSetLatestDashboardVersion);

  const addMetricToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      const existingMetricIds = new Set(
        dashboardResponse?.dashboard.config.rows?.flatMap((row) =>
          row.items.map((item) => item.id)
        ) || []
      );

      // Determine which metrics to add and remove
      const metricsToAdd = metricIds.filter((id) => !existingMetricIds.has(id));
      const currentMetricCount = existingMetricIds.size;
      const availableSlots = MAX_NUMBER_OF_ITEMS_ON_DASHBOARD - currentMetricCount;

      if (metricsToAdd.length > availableSlots) {
        return openConfirmModal({
          title: 'Dashboard is full',
          content: `The dashboard is full, please remove some metrics before adding more. You can only have ${MAX_NUMBER_OF_ITEMS_ON_DASHBOARD} metrics on a dashboard at a time.`,
          primaryButtonProps: {
            text: 'Okay'
          },
          onOk: () => {}
        });
      }

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
        setLatestDashboardVersion(data.dashboard.id, data.dashboard.version_number);
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
  const setLatestDashboardVersion = useDashboardQueryStore((x) => x.onSetLatestDashboardVersion);

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
    mutationFn: removeMetricFromDashboard,
    onSuccess: (data) => {
      if (data) {
        setLatestDashboardVersion(data.dashboard.id, data.dashboard.version_number);
      }
    }
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
      page_size: 3500
    };
  }, [params]);

  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(filters),
    queryFn: () => dashboardsGetList(filters),
    ...options
  });
};

export const prefetchGetDashboardsList = async (
  queryClient: QueryClient,
  params?: Parameters<typeof dashboardsGetList>[0]
) => {
  const options = dashboardQueryKeys.dashboardGetList(params);
  const isStale = isQueryStale(options, queryClient);
  if (!isStale) return queryClient;

  const lastQueryKey = options.queryKey[options.queryKey.length - 1];
  const compiledParams = lastQueryKey as Parameters<typeof dashboardsGetList>[0];

  await queryClient.prefetchQuery({ ...options, queryFn: () => dashboardsGetList(compiledParams) });

  return queryClient;
};
