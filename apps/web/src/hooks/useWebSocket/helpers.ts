import type { BusterSocketResponseRoute } from '@/api/buster_socket';
import type {
  BusterSocketResponseBase,
  BusterSocketResponseMessage
} from '@/api/buster_socket/base_interfaces';
import { ChatsResponses } from '@/api/buster_socket/chats';
import { isDev } from '@/config';

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
    ...ChatsResponses
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
