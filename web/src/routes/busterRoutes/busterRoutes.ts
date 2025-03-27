import { BusterAppRoutes, BusterAppRoutesWithArgs } from './busterAppRoutes';
import { BusterAuthRoutes, BusterAuthRoutesWithArgs } from './busterAuthRoutes';
import { BusterEmbedRoutes, BusterEmbedRoutesWithArgs } from './busterEmbedRoutes';
import { BusterSettingsRoutes, BusterSettingsRoutesWithArgs } from './busterSettingsRoutes';

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
  ...BusterRootRoutes
};

export type BusterRoutes =
  | BusterAppRoutes
  | BusterAuthRoutes
  | BusterSettingsRoutes
  | BusterEmbedRoutes
  | BusterRootRoutes;

export type BusterRoutesWithArgs = BusterRootRoutesWithArgs &
  BusterAuthRoutesWithArgs &
  BusterAppRoutesWithArgs &
  BusterEmbedRoutesWithArgs &
  BusterSettingsRoutesWithArgs;

export type BusterRoutesWithArgsRoute = BusterRoutesWithArgs[BusterRoutes];
