import React, { PropsWithChildren, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import { createContext, useContextSelector } from 'use-context-selector';
import { queryKeys } from '@/api/query_keys';
import { useDashboardAssosciations } from './useDashboardAssosciations';
import { useDashboardCreate } from './useDashboardCreate';
import { useDashboardUpdateConfig } from './useDashboardUpdateConfig';
import { useQueryClient } from '@tanstack/react-query';

export const useBusterDashboards = () => {
  const queryClient = useQueryClient();

  const getDashboardMemoized = useMemoizedFn((dashboardId: string) => {
    const options = queryKeys.dashboardGetDashboard(dashboardId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData(queryKey);
  });

  const dashboardUpdateConfig = useDashboardUpdateConfig({ getDashboardMemoized });
  const onUpdateDashboard = dashboardUpdateConfig.onUpdateDashboard;
  const updateDashboardMutation = dashboardUpdateConfig.updateDashboardMutation;

  const dashboardAssosciations = useDashboardAssosciations({
    getDashboardMemoized,
    updateDashboardMutation
  });

  const dashboardCreate = useDashboardCreate({
    onUpdateDashboard
  });

  return {
    ...dashboardAssosciations,
    ...dashboardCreate,
    ...dashboardUpdateConfig,
    getDashboardMemoized
  };
};

export const BusterDashboards = createContext<ReturnType<typeof useBusterDashboards>>(
  {} as ReturnType<typeof useBusterDashboards>
);

export const BusterDashboardIndividualProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const dashboards = useBusterDashboards();

  return <BusterDashboards.Provider value={dashboards}>{children}</BusterDashboards.Provider>;
};

export const useBusterDashboardContextSelector = <T,>(
  selector: (state: ReturnType<typeof useBusterDashboards>) => T
) => useContextSelector(BusterDashboards, selector);
