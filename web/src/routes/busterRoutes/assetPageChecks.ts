import { BusterAuthRoutes } from './busterAuthRoutes';
import { BusterEmbedRoutes } from './busterEmbedRoutes';
import { BusterRoutes } from './busterRoutes';
import type { NextRequest } from 'next/server';
import {
  createBusterRoute,
  createPathnameToBusterRoute,
  extractPathParamsFromRoute
} from './createRouteHelpers';

const assetCheckPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_METRIC_ID_RESULTS,
  BusterRoutes.APP_METRIC_ID_FILE__HIDDEN,
  BusterRoutes.APP_METRIC_ID_VERSION_NUMBER,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_DASHBOARD_ID_FILE,
  BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER,
  BusterRoutes.APP_COLLECTIONS_ID,
  BusterRoutes.APP_CHAT,
  BusterRoutes.APP_CHAT_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER
];

const assetRedirectRecord: Partial<Record<BusterRoutes, BusterRoutes>> = {
  [BusterRoutes.APP_METRIC_ID_CHART]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_METRIC_ID_RESULTS]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_METRIC_ID_FILE__HIDDEN]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_METRIC_ID_VERSION_NUMBER]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_DASHBOARD_ID]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_DASHBOARD_ID_FILE]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER]: BusterRoutes.EMBED_METRIC_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE]: BusterRoutes.EMBED_DASHBOARD_ID,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER]: BusterRoutes.EMBED_DASHBOARD_ID
};

const publicPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID_CHART,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
  BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
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
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const newRoute = createBusterRoute({ route: matched, ...(params as any) });
    return newRoute;
  }

  return undefined;
};
