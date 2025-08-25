import type { NextRequest } from 'next/server';
import { BusterAuthRoutes } from './busterAuthRoutes';
import { BusterEmbedRoutes } from './busterEmbedRoutes';
import { BusterRoutes, type BusterRoutesWithArgsRoute } from './busterRoutes';
import {
  createBusterRoute,
  createPathnameToBusterRoute,
  extractPathParamsFromRoute
} from './createRouteHelpers';

const assetCheckPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_METRIC_ID_RESULTS,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_DASHBOARD_ID_FILE,
  BusterRoutes.APP_COLLECTIONS_ID,
  BusterRoutes.APP_REPORTS_ID,
  BusterRoutes.APP_REPORTS_ID_FILE,
  BusterRoutes.APP_CHAT,
  BusterRoutes.APP_CHAT_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_CHART,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_RESULTS,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_SQL,
  BusterRoutes.APP_CHAT_ID_REPORT_ID,
  BusterRoutes.APP_CHAT_ID_REPORT_ID_FILE
];

const assetRedirectRecord: Partial<Record<BusterRoutes, BusterRoutes>> = {
  [BusterRoutes.APP_METRIC_ID_CHART]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_METRIC_ID_RESULTS]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_DASHBOARD_ID]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_DASHBOARD_ID_FILE]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_REPORTS_ID]: BusterRoutes.EMBED_REPORTS_ID,
  [BusterRoutes.APP_REPORTS_ID_FILE]: BusterRoutes.EMBED_REPORTS_ID,
  [BusterRoutes.APP_CHAT]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_CHART]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_RESULTS]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_METRIC_ID_SQL]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_REPORT_ID]: BusterRoutes.EMBED_REPORTS_ID,
  [BusterRoutes.APP_CHAT_ID_REPORT_ID_FILE]: BusterRoutes.EMBED_REPORTS_ID
};

const embedAssetToRegularAssetRecord: Record<BusterEmbedRoutes, BusterRoutes> = {
  [BusterRoutes.EMBED_METRIC_ID]: BusterRoutes.APP_METRIC_ID_CHART,
  [BusterRoutes.EMBED_DASHBOARD_ID]: BusterRoutes.APP_DASHBOARD_ID,
  [BusterRoutes.EMBED_COLLECTION_ID]: BusterRoutes.APP_COLLECTIONS_ID,
  [BusterRoutes.EMBED_REPORTS_ID]: BusterRoutes.APP_REPORTS_ID
};

const publicPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_REPORTS_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
  BusterRoutes.APP_CHAT_ID_REPORT_ID,
  ...Object.values(BusterEmbedRoutes),
  ...Object.values(BusterAuthRoutes)
];

export const isPublicPage = (request: NextRequest): boolean => {
  const route = request.nextUrl.pathname;
  const matchedRoute = createPathnameToBusterRoute(route);
  return publicPages.some((page) => page === matchedRoute);
};

export const isShareableAssetPage = (request: NextRequest): boolean => {
  const route = request.nextUrl.pathname;
  const matchedRoute = createPathnameToBusterRoute(route);
  return assetCheckPages.includes(matchedRoute);
};

const embedPages: BusterRoutes[] = Object.values(BusterEmbedRoutes);
export const isEmbedPage = (request: NextRequest): boolean => {
  const route = request.nextUrl.pathname;
  const matchedRoute = createPathnameToBusterRoute(route);
  return embedPages.includes(matchedRoute);
};

export const getEmbedAssetRedirect = (request: NextRequest): string | undefined => {
  const route = request.nextUrl.pathname;
  const matchedRoute = createPathnameToBusterRoute(route);
  const matched = assetRedirectRecord[matchedRoute];
  const params = extractPathParamsFromRoute(route);

  if (matched) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I am just using any here because it was a pain to type this out
    const newRoute = createBusterRoute({ route: matched, ...(params as any) });
    return newRoute;
  }

  return undefined;
};

export const getEmbedAssetToRegularAsset = (pathnameAndQueryParams: string) => {
  const route = createPathnameToBusterRoute(pathnameAndQueryParams);
  const matched = embedAssetToRegularAssetRecord[route as BusterEmbedRoutes];

  if (matched) {
    const params = extractPathParamsFromRoute(pathnameAndQueryParams);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- I am just using any here because it was a pain to type this out
    return createBusterRoute({ route: matched as BusterRoutes, ...(params as any) });
  }
};
