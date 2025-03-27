import { BusterAuthRoutes } from './busterAuthRoutes';
import { BusterEmbedRoutes } from './busterEmbedRoutes';
import { BusterRoutes } from './busterRoutes';
import { NextRequest } from 'next/server';
import { createPathnameToBusterRoute } from './createRouteHelpers';

const assetCheckPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_CHAT
];

const publicPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID,
  BusterRoutes.APP_DASHBOARD_ID,
  ...Object.values(BusterEmbedRoutes),
  ...Object.values(BusterAuthRoutes)
];

export const isPublicPage = (request: NextRequest): boolean => {
  const route = request.nextUrl.pathname;
  const matchedRoute = createPathnameToBusterRoute(route);
  return publicPages.some((page) => page === matchedRoute);
};

export const assetPermissionCheck = (request: NextRequest): boolean => {
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
