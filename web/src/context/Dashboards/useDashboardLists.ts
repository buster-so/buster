import type { DashboardsListEmitPayload, DashboardUpdate } from '@/api/buster_socket/dashboards';
import type { BusterDashboardListItem } from '@/api/buster_rest';
import { useMemoizedFn } from 'ahooks';
import React, { PropsWithChildren, useRef, useState } from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';

export const useDashboardLists = () => {
  const busterSocket = useBusterWebSocket();

  const hasMountedDashboardList = useRef(false);
  const [dashboardsList, setDashboardsList] = useState<BusterDashboardListItem[]>([]);
  const [dashboardListFilters, setDashboardListFilters] = useState<
    DashboardsListEmitPayload['payload']['filters']
  >({});
  const [loadedDashboards, setLoadedDashboards] = useState<boolean>(false);

  const onInitializeDashboardsList = (dashboards: BusterDashboardListItem[]) => {
    setDashboardsList(dashboards);
    setLoadedDashboards(true);
  };

  const refreshDashboardsList = useMemoizedFn(
    async (filters?: DashboardsListEmitPayload['payload']['filters']) => {
      const chosenFilters = filters ? filters : dashboardListFilters;
      const res = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/dashboards/list',
          payload: {
            page_size: 1000,
            page: 0,
            filters: chosenFilters
          }
        },
        responseEvent: {
          route: '/dashboards/list:getDashboardsList',
          callback: onInitializeDashboardsList
        }
      });
      return res as BusterDashboardListItem[];
    }
  );

  const onSetDashboardListFilters = useMemoizedFn(
    (newFilters: DashboardsListEmitPayload['payload']['filters']) => {
      setDashboardListFilters(newFilters);
      return refreshDashboardsList(newFilters);
    }
  );

  const unsubscribeFromDashboardsList = useMemoizedFn(() => {
    busterSocket.off({
      route: '/dashboards/list:getDashboardsList',
      callback: onInitializeDashboardsList
    });
    hasMountedDashboardList.current = false;
  });

  const initDashboardsList = useMemoizedFn(() => {
    if (!hasMountedDashboardList.current) {
      refreshDashboardsList();
    }
    hasMountedDashboardList.current = true;
  });

  const getDashboardFromList = useMemoizedFn((dashboardId: string) => {
    return dashboardsList.find((dashboard) => dashboard.id === dashboardId);
  });

  const updateDashboardNameInList = useMemoizedFn((dashboardId: string, newName: string) => {
    setDashboardsList((prevDashboards) =>
      prevDashboards.map((dashboard) =>
        dashboard.id === dashboardId ? { ...dashboard, name: newName } : dashboard
      )
    );
  });

  return {
    updateDashboardNameInList,
    onInitializeDashboardsList,
    refreshDashboardsList,
    onSetDashboardListFilters,
    unsubscribeFromDashboardsList,
    initDashboardsList,
    setDashboardsList,
    getDashboardFromList,
    hasMountedDashboardList,
    dashboardsList,
    dashboardListFilters,
    loadedDashboards
  };
};
