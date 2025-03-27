import { BusterAppRoutes } from './busterAppRoutes';
import { BusterRoutes, BusterRoutesWithArgsRoute } from './busterRoutes';

export const createBusterRoute = ({ route, ...args }: BusterRoutesWithArgsRoute) => {
  if (!args) return route;

  // Split the route into base path and query template if it exists
  const [basePath, queryTemplate] = route.split('?');

  // Replace path parameters
  const resultPath = Object.entries(args).reduce<string>((acc, [key, value]) => {
    return acc.replace(`:${key}`, value as string).replace(`[${key}]`, value as string);
  }, basePath);

  // If there's no query template, return just the path
  if (!queryTemplate) return resultPath;

  // Handle query parameters
  const queryParams = queryTemplate
    .split('&')
    .map((param) => {
      const [key] = param.split('=');
      const paramName = key.replace(':', '');
      const value = (args as Record<string, string | undefined>)[paramName];
      return value != null ? `${key.replace(':', '')}=${value}` : null;
    })
    .filter(Boolean);

  // Return path with query string if there are valid query params
  return queryParams.length > 0 ? `${resultPath}?${queryParams.join('&')}` : resultPath;
};

const routeToRegex = (route: string): RegExp => {
  const [basePath] = route.split('?');
  const pattern = basePath.replace(/:[^/]+/g, '([^/]+)');
  return new RegExp(`^${pattern}$`);
};

const routes = Object.values(BusterRoutes) as string[];
const queryRoutes = routes.filter((route) => route.includes('?'));
const routeRegexCache = new Map<string, RegExp>();

const getRouteRegex = (route: string): RegExp => {
  const cached = routeRegexCache.get(route);
  if (cached) return cached;

  const regex = routeToRegex(route);
  routeRegexCache.set(route, regex);
  return regex;
};

const matchDynamicUrlToRoute = (pathname: string): BusterAppRoutes | null => {
  const hasQuery = pathname.includes('?');
  const basePath = hasQuery ? pathname.split('?')[0] : pathname;
  const routesToCheck = hasQuery ? queryRoutes : routes;

  for (const route of routesToCheck) {
    const routeBasePath = hasQuery ? route.split('?')[0] : route;
    if (getRouteRegex(routeBasePath).test(basePath)) {
      return route as BusterAppRoutes;
    }
  }
  return null;
};

export const createPathnameToBusterRoute = (pathname: string): BusterRoutes => {
  return (
    (routes.find((route) => route === pathname) as BusterRoutes) ||
    matchDynamicUrlToRoute(pathname) ||
    BusterRoutes.ROOT
  );
};
