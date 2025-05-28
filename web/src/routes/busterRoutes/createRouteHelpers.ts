import type { BusterAppRoutes } from './busterAppRoutes';
import { BusterRoutes, type BusterRoutesWithArgsRoute } from './busterRoutes';

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
    .map((param: string) => {
      const [key, value] = param.split('=');
      return value.startsWith(':')
        ? (args as Record<string, string | undefined>)[value.slice(1)]
          ? `${key}=${(args as Record<string, string | undefined>)[value.slice(1)]}`
          : null
        : `${key}=${value}`;
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

export const extractPathParamsFromRoute = (route: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const [basePath, queryString] = route.split('?');

  // Find matching route template from BusterRoutes
  const routeTemplate = Object.values(BusterRoutes).find((template) => {
    const [templateBase] = template.split('?');
    const templateParts = templateBase.split('/');
    const routeParts = basePath.split('/');

    if (templateParts.length !== routeParts.length) return false;

    return templateParts.every((part, i) => {
      let cleanPart = part;
      if (part.includes('?')) {
        cleanPart = part.split('?')[0];
      }
      return cleanPart.startsWith(':') || cleanPart.startsWith('[') || cleanPart === routeParts[i];
    });
  });

  if (!routeTemplate) return params;

  // Extract path parameters
  const [templateBase] = routeTemplate.split('?');
  const templateParts = templateBase.split('/');
  const routeParts = basePath.split('/');

  templateParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = routeParts[index];
    } else if (part.startsWith('[') && part.endsWith(']')) {
      const paramName = part.slice(1, -1);
      params[paramName] = routeParts[index];
    }
  });

  // Handle query parameters if they exist
  if (queryString && routeTemplate.includes('?')) {
    const queryParams = new URLSearchParams(queryString);
    const templateQueryParams = routeTemplate.split('?')[1].split('&');

    for (const param of templateQueryParams) {
      const [key, template] = param.split('=');
      if (template?.startsWith(':')) {
        const paramName = template.slice(1);
        if (Object.prototype.hasOwnProperty.call(params, paramName)) {
          queryParams.set(key, String(params[paramName]));
        }
      }
    }
  }

  return params;
};
