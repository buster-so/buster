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
  const dynamicParts = /:[^/]+/g;
  const regexPattern = route.replace(dynamicParts, '[^/]+');
  return new RegExp(`^${regexPattern}$`);
};

const routes = Object.values(BusterRoutes) as string[];
const matchDynamicUrlToRoute = (pathname: string): BusterAppRoutes | null => {
  for (const route of routes) {
    const regex = routeToRegex(route);
    if (regex.test(pathname)) {
      return route as BusterAppRoutes;
    }
  }
  return null;
};

export const createPathnameToBusterRoute = (pathname: string): BusterRoutes => {
  const foundRoute = Object.values(BusterRoutes).find((route) => route === pathname);
  return foundRoute || (matchDynamicUrlToRoute(pathname) as BusterRoutes);
};
