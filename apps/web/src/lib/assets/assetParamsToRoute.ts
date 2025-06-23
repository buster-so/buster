import type { FileType, ReasoningFileType } from '@/api/asset_interfaces/chat';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type {
  DashboardFileViewSecondary,
  FileViewSecondary,
  MetricFileViewSecondary
} from '../../layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';
import type { ReasoingMessage_ThoughtFileType } from '@buster/server-shared/chats';

type UnionOfFileTypes = FileType | ReasoningFileType | ReasoingMessage_ThoughtFileType;

type BaseParams = {
  chatId: string | undefined;
  assetId: string;
  type: UnionOfFileTypes;
  secondaryView?: FileViewSecondary;
  versionNumber?: number;
};

type MetricRouteParams = {
  metricId: string;
  chatId?: string;
  secondaryView?: MetricFileViewSecondary;
  versionNumber?: number;
};

export const assetParamsToRoute = ({
  chatId,
  assetId,
  type,
  versionNumber,
  secondaryView
}: BaseParams): string => {
  if (type === 'metric') {
    return createMetricRoute({
      metricId: assetId,
      chatId,
      secondaryView: secondaryView as MetricFileViewSecondary,
      versionNumber
    });
  }

  if (type === 'dashboard') {
    return createDashboardRoute({
      dashboardId: assetId,
      chatId,
      versionNumber,
      secondaryView: secondaryView as DashboardFileViewSecondary
    });
  }

  if (type === 'reasoning') {
    return createReasoningRoute({
      messageId: assetId,
      chatId
    });
  }

  if (type === 'dataset') {
    return createDatasetRoute({
      datasetId: assetId,
      chatId
    });
  }

  if (type === 'collection') {
    return createBusterRoute({
      route: BusterRoutes.APP_COLLECTIONS_ID,
      collectionId: assetId
    });
  }

  if (type === 'term') {
    return createBusterRoute({
      route: BusterRoutes.APP_TERMS_ID,
      termId: assetId
    });
  }

  if (type === 'todo') {
    return '';
  }

  if (type === 'agent-action') {
    return '';
  }

  if (type === 'topic') {
    return '';
  }

  if (type === 'value') {
    return '';
  }

  if (type === 'empty') {
    return '';
  }

  const exhaustiveCheck: never | undefined = type;

  console.warn('Asset params to route has not been implemented for this file type', type);
  return '';
};

const createMetricRoute = ({
  metricId,
  chatId,
  secondaryView,
  versionNumber
}: MetricRouteParams) => {
  const baseParams = { versionNumber, metricId, secondaryView };

  if (chatId) {
    if (versionNumber) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
        chatId,
        ...baseParams,
        versionNumber
      });
    }

    switch (secondaryView) {
      case 'chart-edit':
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          ...baseParams
        });
      case 'version-history':
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          ...baseParams
        });
      default: {
        const test: never | undefined = secondaryView;
        return createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
          chatId,
          metricId
        });
      }
    }
  }

  // Non-chat metric routes

  if (versionNumber) {
    return createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_VERSION_NUMBER,
      ...baseParams
    });
  }

  switch (secondaryView) {
    case 'chart-edit':
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        ...baseParams
      });
    default:
      return createBusterRoute({
        route: BusterRoutes.APP_METRIC_ID_CHART,
        metricId
      });
  }
};

const createDashboardRoute = ({
  dashboardId,
  chatId,
  secondaryView,
  versionNumber
}: {
  dashboardId: string;
  chatId?: string;
  secondaryView?: DashboardFileViewSecondary;
  versionNumber?: number;
}) => {
  if (chatId) {
    if (versionNumber) {
      return createBusterRoute({
        route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
        chatId,
        dashboardId,
        versionNumber,
        secondaryView
      });
    }

    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
      chatId,
      dashboardId,
      secondaryView
    });
  }

  if (versionNumber) {
    return createBusterRoute({
      route: BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER,
      dashboardId,
      versionNumber,
      secondaryView
    });
  }

  return createBusterRoute({
    route: BusterRoutes.APP_DASHBOARD_ID,
    dashboardId,
    secondaryView
  });
};

const createReasoningRoute = ({
  messageId,
  chatId
}: {
  messageId: string;
  chatId: string | undefined;
}) => {
  if (!chatId) {
    return '';
  }

  return createBusterRoute({
    route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
    chatId,
    messageId
  });
};

const createDatasetRoute = ({
  datasetId,
  chatId
}: {
  datasetId: string;
  chatId: string | undefined;
}) => {
  return createBusterRoute({
    route: BusterRoutes.APP_DATASETS_ID,
    datasetId
  });
};
