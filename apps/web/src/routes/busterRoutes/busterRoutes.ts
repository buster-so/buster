import { BusterAppRoutes, type BusterAppRoutesWithArgs } from './busterAppRoutes';
import { BusterAuthRoutes, type BusterAuthRoutesWithArgs } from './busterAuthRoutes';
import { BusterEmbedRoutes, type BusterEmbedRoutesWithArgs } from './busterEmbedRoutes';
import { BusterInfoRoutes, type BusterInfoRoutesWithArgs } from './busterInfoRoutes';
import { BusterSettingsRoutes, type BusterSettingsRoutesWithArgs } from './busterSettingsRoutes';

export enum BusterRootRoutes {
  ROOT = '/'
}

export type BusterRootRoutesWithArgs = {
  [BusterRootRoutes.ROOT]: { route: BusterRootRoutes.ROOT };
};

export const BusterRoutes = {
  ...BusterAppRoutes,
  ...BusterAuthRoutes,
  ...BusterSettingsRoutes,
  ...BusterEmbedRoutes,
  ...BusterInfoRoutes,
  ...BusterRootRoutes
};

export type BusterRoutes =
  | BusterAppRoutes
  | BusterAuthRoutes
  | BusterSettingsRoutes
  | BusterEmbedRoutes
  | BusterInfoRoutes
  | BusterRootRoutes;

export type BusterRoutesWithArgs = BusterRootRoutesWithArgs &
  BusterAuthRoutesWithArgs &
  BusterAppRoutesWithArgs &
  BusterEmbedRoutesWithArgs &
  BusterSettingsRoutesWithArgs &
  BusterInfoRoutesWithArgs;

export type BusterRoutesWithArgsRoute = BusterRoutesWithArgs[BusterRoutes];
