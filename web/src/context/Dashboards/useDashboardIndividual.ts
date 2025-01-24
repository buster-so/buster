import { DashboardUpdate } from '@/api/buster_socket/dashboards';
import {
  BusterDashboard,
  BusterDashboardResponse,
  BusterVerificationStatus
} from '@/api/buster_rest';
import { useMemoizedFn } from 'ahooks';
import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useDashboardLists } from './useDashboardLists';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useBusterNotifications } from '../BusterNotifications';
import isEqual from 'lodash/isEqual';
import { useBusterAssetsContextSelector } from '../Assets/BusterAssetsProvider';
import { useDashboardMetrics } from './useDashboardMetrics';

export const useDashboardIndividual = ({
  refreshDashboardsList,
  setDashboardsList,
  openedDashboardId,
  onUpdateDashboardMetrics,
  updateDashboardNameInList
}: {
  refreshDashboardsList: ReturnType<typeof useDashboardLists>['refreshDashboardsList'];
  setDashboardsList: ReturnType<typeof useDashboardLists>['setDashboardsList'];
  openedDashboardId: string;
  onUpdateDashboardMetrics: ReturnType<typeof useDashboardMetrics>['onUpdateDashboardMetrics'];
  updateDashboardNameInList: ReturnType<typeof useDashboardLists>['updateDashboardNameInList'];
}) => {
  const busterSocket = useBusterWebSocket();
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  const { openErrorNotification, openConfirmModal } = useBusterNotifications();

  const router = useRouter();
  const [dashboards, setDashboard] = useState<Record<string, BusterDashboardResponse>>({});
  const [creatingDashboard, setCreatingDashboard] = useState<boolean>(false);
  const [editingDashboardTitle, setEditingDashboardTitle] = useState<boolean>(false);

  const dashboardsSubscribed = useRef<Record<string, boolean>>({});

  const onShareDashboard = useMemoizedFn(
    async (
      props: Pick<
        DashboardUpdate['payload'],
        | 'id'
        | 'publicly_accessible'
        | 'public_password'
        | 'user_permissions'
        | 'team_permissions'
        | 'public_expiry_date'
        | 'remove_users'
        | 'remove_teams'
      >
    ) => {
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/dashboards/update',
          payload: { ...props }
        },
        responseEvent: {
          route: '/dashboards/update:updateDashboard',
          callback: _onGetDashboardState
        }
      });
    }
  );

  const onCreateNewDashboard = useMemoizedFn(
    async (newDashboard: {
      name?: string;
      description?: string | null;
      rerouteToDashboard?: boolean;
    }) => {
      if (creatingDashboard) {
        return;
      }
      const { rerouteToDashboard, ...rest } = newDashboard;
      setCreatingDashboard(true);

      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/dashboards/post',
          payload: { ...rest, name: rest.name || '' }
        },
        responseEvent: {
          route: '/dashboards/post:postDashboard',
          callback: (v) => {
            setTimeout(() => {
              refreshDashboardsList();
              onUpdateDashboard(v);
            }, 700);

            if (rerouteToDashboard) {
              router.push(
                createBusterRoute({
                  route: BusterRoutes.APP_DASHBOARD_ID,
                  dashboardId: v.id
                })
              );
            }

            return v;
          },
          onError: (e) => openErrorNotification(e)
        }
      });

      setTimeout(() => {
        setCreatingDashboard(false);
      }, 500);

      return res as BusterDashboard;
    }
  );

  const onDeleteDashboard = useMemoizedFn(
    async (dashboardId: string | string[], ignoreConfirm?: boolean) => {
      const method = () => {
        setDashboardsList((prevDashboards) => {
          return prevDashboards.filter((dashboard) => dashboard.id !== dashboardId);
        });
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        busterSocket.emit({
          route: '/dashboards/delete',
          payload: {
            ids
          }
        });
        setDashboardsList((prevDashboards) => {
          return prevDashboards.filter((dashboard) => !ids.includes(dashboard.id));
        });
      };
      if (ignoreConfirm) {
        return method();
      }

      return await openConfirmModal({
        title: 'Delete Dashboard',
        content: 'Are you sure you want to delete this dashboard?',
        onOk: () => {
          method();
        },
        useReject: true
      });
    }
  );

  const _updateDashboardResponseToServer = useMemoizedFn(
    (
      newDashboard: BusterDashboardResponse & {
        status?: BusterVerificationStatus;
      }
    ) => {
      const oldDashboard = dashboards[newDashboard.dashboard.id];
      if (isEqual(oldDashboard, newDashboard)) {
        return;
      }

      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          id: newDashboard.dashboard.id,
          description: newDashboard.dashboard.description,
          name: newDashboard.dashboard.name,
          config: newDashboard.dashboard.config
        }
      });
    }
  );

  const onUpdateDashboardRequest = useMemoizedFn(
    (newDashboard: Partial<BusterDashboardResponse>) => {
      const newDashboardState: BusterDashboardResponse = {
        ...dashboards[openedDashboardId],
        ...newDashboard
      };
      setDashboard((prevDashboards) => {
        return {
          ...prevDashboards,
          [openedDashboardId]: newDashboardState
        };
      });
      _updateDashboardResponseToServer(newDashboardState);
    }
  );

  const onUpdateDashboard = useMemoizedFn((newDashboard: Partial<BusterDashboard>) => {
    const id = newDashboard?.id || openedDashboardId;
    const currentDashboard = dashboards[id] || {};
    const newDashboardState = {
      ...currentDashboard,
      dashboard: {
        ...currentDashboard.dashboard,
        ...newDashboard
      }
    };
    const didNameChange =
      newDashboard.name && newDashboard.name !== currentDashboard.dashboard.name;

    onUpdateDashboardRequest(newDashboardState);
    if (didNameChange) {
      const newName = newDashboard.name || currentDashboard.dashboard.name;
      updateDashboardNameInList(id, newName);
    }
  });

  const onUpdateDashboardConfig = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard['config']>, dashboardId?: string) => {
      const id = dashboardId || openedDashboardId;
      const newDashboardState = {
        ...dashboards[id],
        dashboard: {
          ...dashboards[id].dashboard,
          config: {
            ...dashboards[id].dashboard.config,
            ...newDashboard
          }
        }
      };
      onUpdateDashboardRequest(newDashboardState);
    }
  );

  const _onGetDashboardState = useMemoizedFn((d: BusterDashboardResponse) => {
    //set dashboard
    setDashboard((prevDashboards) => {
      return {
        ...prevDashboards,
        [d.dashboard.id]: d
      };
    });

    //set metrics
    onUpdateDashboardMetrics(d.metrics);
  });

  const onAddToCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId?: string;
    }) => {
      const id = dashboardId || openedDashboardId;
      busterSocket.emitAndOnce({
        emitEvent: {
          route: '/dashboards/update',
          payload: {
            add_to_collections: typeof collectionId === 'string' ? [collectionId] : collectionId,
            id
          }
        },
        responseEvent: {
          route: '/dashboards/update:updateDashboard',
          callback: _onGetDashboardState
        }
      });
    }
  );

  const onBulkAddRemoveToDashboard = useMemoizedFn(
    async ({ threadIds, dashboardId }: { dashboardId: string; threadIds: string[] }) => {
      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/dashboards/update',
          payload: {
            id: dashboardId,
            threads: threadIds
          }
        },
        responseEvent: {
          route: '/dashboards/update:updateDashboard',
          callback: _onGetDashboardState
        }
      });
    }
  );

  const refreshDashboard = useMemoizedFn(async (dashboardId: string) => {
    const { password } = getAssetPassword(dashboardId);
    const res = await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/dashboards/get',
        payload: {
          id: dashboardId,
          password
        }
      },
      responseEvent: {
        route: '/dashboards/get:getDashboardState',
        callback: _onGetDashboardState
      }
    });
    return res as BusterDashboardResponse;
  });

  const subscribeToDashboard = useMemoizedFn(({ dashboardId }: { dashboardId: string }) => {
    if (dashboardId && !dashboardsSubscribed.current[dashboardId]) {
      refreshDashboard(dashboardId);

      dashboardsSubscribed.current[dashboardId] = true;
    }
  });

  const unSubscribeToDashboard = useMemoizedFn(({ dashboardId }: { dashboardId: string }) => {
    busterSocket.emit({
      route: '/dashboards/unsubscribe',
      payload: {
        id: dashboardId
      }
    });
    dashboardsSubscribed.current[dashboardId] = false;
  });

  const onVerifiedDashboard = useMemoizedFn(
    async ({ dashboardId, status }: { dashboardId: string; status: BusterVerificationStatus }) => {
      await _updateDashboardResponseToServer({
        ...dashboards[dashboardId],
        status
      });
    }
  );

  const removeItemFromIndividualDashboard = useMemoizedFn(
    ({ dashboardId, threadId }: { dashboardId: string; threadId: string }) => {
      setDashboard((prevDashboards) => {
        const dashboardResponse: BusterDashboardResponse | undefined = prevDashboards[dashboardId];
        if (!dashboardResponse) return prevDashboards;
        const newThreads = dashboardResponse.metrics.filter((t) => t.id !== threadId);
        return {
          ...prevDashboards,
          [dashboardId]: {
            ...prevDashboards[dashboardId],
            metrics: newThreads
          }
        };
      });
    }
  );

  return {
    dashboards,
    onShareDashboard,
    setEditingDashboardTitle,
    removeItemFromIndividualDashboard,
    onBulkAddRemoveToDashboard,
    editingDashboardTitle,
    refreshDashboard,
    onVerifiedDashboard,
    openedDashboardId,
    creatingDashboard,
    onCreateNewDashboard,
    onDeleteDashboard,
    subscribeToDashboard,
    unSubscribeToDashboard,
    onUpdateDashboard,
    onUpdateDashboardConfig,
    _onGetDashboardState,
    onAddToCollection
  };
};
