import { BusterSocketResponseRoute } from '@/api/buster_socket';
import {
  BusterSocketResponseBase,
  BusterSocketResponseMessage
} from '@/api/buster_socket/baseInterfaces';
import { ThreadResponses } from '@/api/buster_socket/threads';
import { DashboardResponses } from '@/api/buster_socket/dashboards';
import { isDev } from '@/config';
import { DatasetResponses } from '@/api/buster_socket/datasets';
import { UserResponses } from '@/api/buster_socket/user';
import { CollectionResponses } from '@/api/buster_socket/collections';
import { DatasourceResponses } from '@/api/buster_socket/datasources/datasourceResponses';
import { TermsResponses } from '@/api/buster_socket/terms/termsResponses';
import { PermissionsResponses } from '@/api/buster_socket/permissions';
import { TeamResponses } from '@/api/buster_socket/user/teamResponses';
import { SearchResponses } from '@/api/buster_socket/search';
import { OrganizationResponses } from '@/api/buster_socket/organizations';
import { SQLResponses } from '@/api/buster_socket/sql';

export const createBusterResponse = (
  message: BusterSocketResponseMessage
): BusterSocketResponseBase => {
  const parsedMessage = message;
  const { route, payload, error, event } = parsedMessage;
  const routeAndEvent = `${route}:${event}` as BusterSocketResponseRoute;
  if (isDev) {
    isKnownMessageRoute(parsedMessage);
  }

  return {
    route: routeAndEvent,
    payload,
    error
  };
};

const isKnownMessageRoute = (parsedMessage: BusterSocketResponseMessage) => {
  const allResponses = {
    ...ThreadResponses,
    ...DashboardResponses,
    ...DatasetResponses,
    ...UserResponses,
    ...CollectionResponses,
    ...DatasourceResponses,
    ...SQLResponses,
    ...TermsResponses,
    ...PermissionsResponses,
    ...TeamResponses,
    ...SearchResponses,
    ...OrganizationResponses
  };
  const event = parsedMessage?.event;
  const route = parsedMessage?.route;
  const payload = parsedMessage?.payload;
  const allBusterSocketRoutes = Object.keys(allResponses);
  const allValues = Object.values(allBusterSocketRoutes) as string[];
  const combinedRoute = `${route}:${event}`;
  const isFound = allValues.includes(route) || allValues.includes(combinedRoute);
  if (!isFound) {
    console.warn('Unknown route:', combinedRoute, payload);
  }
};
