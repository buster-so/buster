import {
  BusterDashboard,
  BusterDashboardListItem,
  BusterDashboardResponse,
  BusterMetricDataResponse,
  BusterVerificationStatus,
  IBusterDashboardMetric
} from '@/api/buster_rest';
import { useParams, useRouter } from 'next/navigation';
import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useAppLayoutContextSelector } from '../BusterAppLayout';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { DashboardUpdate, DashboardsListEmitPayload } from '@/api/buster_socket/dashboards';
import isEqual from 'lodash/isEqual';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { upgradeDashboardMetric } from './dashboardContextHelper';
import { useBusterNotifications } from '../BusterNotifications';
import {
  useContextSelector,
  createContext,
  ContextSelector
} from '@fluentui/react-context-selector';
import { useBusterMessageDataContextSelector } from '../MessageData';
import { useDashboardLists } from './useDashboardLists';
import { useDashboardIndividual } from './useDashboardIndividual';
import { useDashboardMetrics } from './useDashboardMetrics';

export const useDashboards = () => {
  const currentSegment = useAppLayoutContextSelector((s) => s.currentSegment);
  const { dashboardId: openedDashboardId } = useParams<{ dashboardId: string }>();

  const [openAddContentModal, setOpenAddContentModal] = useState(false);

  //DASHBOARD LISTS

  const {
    updateDashboardNameInList,
    setDashboardsList,
    refreshDashboardsList,
    onSetDashboardListFilters,
    initDashboardsList,
    loadedDashboards,
    dashboardsList,
    dashboardListFilters,
    hasMountedDashboardList,
    unsubscribeFromDashboardsList,
    getDashboardFromList
  } = useDashboardLists();

  //METRICS INDIVIDUAL
  const {
    getMetric,
    onOpenMetric,
    onRemoveFromCollection,
    resetDashboardMetric,
    onUpdateDashboardMetrics
  } = useDashboardMetrics({ openedDashboardId });

  //DASHBOARD INDIVIDUAL
  const {
    dashboards,
    editingDashboardTitle,
    removeItemFromIndividualDashboard,
    refreshDashboard,
    onVerifiedDashboard,
    creatingDashboard,
    onCreateNewDashboard,
    onDeleteDashboard,
    subscribeToDashboard,
    unSubscribeToDashboard,
    onUpdateDashboard,
    onUpdateDashboardConfig,
    onShareDashboard,
    setEditingDashboardTitle,
    onBulkAddRemoveToDashboard,
    onAddToCollection
  } = useDashboardIndividual({
    refreshDashboardsList,
    setDashboardsList,
    openedDashboardId,
    onUpdateDashboardMetrics,
    updateDashboardNameInList
  });

  useEffect(() => {
    if (!hasMountedDashboardList.current && currentSegment === 'dashboards') {
      initDashboardsList();
    }
  }, [currentSegment]);

  return {
    //DASHBOARDS LIST
    initDashboardsList,
    loadedDashboards,
    dashboardsList,
    dashboardListFilters,
    onSetDashboardListFilters,
    getDashboardFromList,

    //INDIVIDUAL DASHBOARD
    dashboards,
    removeItemFromIndividualDashboard,

    //DASHBOARD METRICS
    getMetric,

    //OTHER
    onBulkAddRemoveToDashboard,
    editingDashboardTitle,
    setEditingDashboardTitle,
    onRemoveFromCollection,
    onAddToCollection,
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
    onOpenMetric,
    unsubscribeFromDashboardsList,
    onShareDashboard,
    openAddContentModal,
    setOpenAddContentModal,
    resetDashboardMetric
  };
};

export const BusterDashboards = createContext<ReturnType<typeof useDashboards>>(
  {} as ReturnType<typeof useDashboards>
);

export const BusterDashboardProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const dashboards = useDashboards();

  return <BusterDashboards.Provider value={dashboards}>{children}</BusterDashboards.Provider>;
};

export const useDashboardContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useDashboards>, T>
) => useContextSelector(BusterDashboards, selector);

export const useIndividualDashboard = ({ dashboardId }: { dashboardId: string | undefined }) => {
  const dashboardResponse = useDashboardContextSelector(
    (state) => state.dashboards[dashboardId || '']
  );
  const subscribeToDashboard = useDashboardContextSelector((state) => state.subscribeToDashboard);
  const unSubscribeToDashboard = useDashboardContextSelector((x) => x.unSubscribeToDashboard);
  const setEditingDashboardTitle = useDashboardContextSelector((x) => x.setEditingDashboardTitle);

  useLayoutEffect(() => {
    if (dashboardId) subscribeToDashboard({ dashboardId });
  }, [dashboardId]);

  useUnmount(() => {
    if (dashboardId) unSubscribeToDashboard({ dashboardId });
    setEditingDashboardTitle(false);
  });

  return {
    dashboardResponse
  };
};
