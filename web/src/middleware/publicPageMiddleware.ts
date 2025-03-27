import { BusterAuthRoutes } from '@/routes/busterRoutes/busterAuthRoutes';
import { BusterEmbedRoutes } from '@/routes/busterRoutes/busterEmbedRoutes';
import { BusterRoutes, createPathnameToBusterRoute } from '@/routes/busterRoutes';
import { NextRequest } from 'next/server';

const assetCheckPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_DASHBOARD_METRICS_ID,
  BusterRoutes.APP_CHAT
];

const publicPages: BusterRoutes[] = [
  BusterRoutes.APP_METRIC_ID,
  BusterRoutes.APP_DASHBOARD_ID,
  BusterRoutes.APP_DASHBOARD_METRICS_ID,
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
