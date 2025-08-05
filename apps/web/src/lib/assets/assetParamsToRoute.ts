import type { FileType, ReasoningFileType } from '@/api/asset_interfaces/chat';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type {
  DashboardFileViewSecondary,
  MetricFileViewSecondary
} from '../../layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';
import type { ReasoingMessage_ThoughtFileType } from '@buster/server-shared/chats';
import { createMetricRoute, type MetricRouteParams } from './createMetricRoute';
import { createDashboardRoute, type DashboardRouteParams } from './createDashboardRoute';
import { createReasoningRoute } from './createReasoningRoute';
import { createDatasetRoute } from './createDatasetRoute';
import { createReportRoute, type ReportRouteParams } from './createReportRoute';

type UnionOfFileTypes = FileType | ReasoningFileType | ReasoingMessage_ThoughtFileType;

type OtherRouteParams = {
  chatId: string | undefined;
  assetId: string | undefined; //will first try and use metricId assuming it is a metric, then dashboardId assuming it is a dashboard, then assetId
  metricId?: string; //if this is provided, it will be used instead of assetId
  dashboardId?: string; //if this is provided, it will be used instead of assetId
  versionNumber?: number; //will first try and use metricVersionNumber assuming it is a metric, then dashboardVersionNumber assuming it is a dashboard, then versionNumber
  metricVersionNumber?: number; //if this is provided, it will be used instead of versionNumber
  dashboardVersionNumber?: number; //if this is provided, it will be used instead of versionNumber
  reportVersionNumber?: number; //if this is provided, it will be used instead of versionNumber
  page?: undefined;
  secondaryView?: undefined | null | string;
  type: UnionOfFileTypes;
};

type BaseParams = MetricRouteParams | DashboardRouteParams | OtherRouteParams | ReportRouteParams;

export const assetParamsToRoute = ({
  chatId,
  assetId,
  type,
  page,
  secondaryView,
  ...rest
}: BaseParams): string => {
  const { versionNumber } = rest as OtherRouteParams;
  const { metricVersionNumber, dashboardVersionNumber } = rest as MetricRouteParams;
  const { metricId, dashboardId } = rest as OtherRouteParams;

  if (!assetId && chatId) {
    return createBusterRoute({
      route: BusterRoutes.APP_CHAT_ID,
      chatId
    });
  }

  if (!assetId) {
    return '';
  }

  if (type === 'metric') {
    return createMetricRoute({
      assetId: metricId || assetId,
      metricVersionNumber: metricVersionNumber || versionNumber,
      chatId,
      secondaryView: secondaryView as MetricFileViewSecondary,
      dashboardVersionNumber,
      dashboardId,
      page: page as MetricRouteParams['page']
    });
  }

  if (type === 'dashboard') {
    return createDashboardRoute({
      assetId: dashboardId || assetId,
      dashboardVersionNumber: dashboardVersionNumber || versionNumber,
      metricVersionNumber,
      chatId,
      page,
      secondaryView: secondaryView as DashboardFileViewSecondary
    });
  }

  if (type === 'report') {
    const { reportVersionNumber } = rest as ReportRouteParams;
    return createReportRoute({
      assetId,
      chatId,
      page,
      reportVersionNumber: reportVersionNumber || versionNumber
    });
  }

  if (type === 'reasoning') {
    return createReasoningRoute({
      assetId,
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
