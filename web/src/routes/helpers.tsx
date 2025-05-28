import { BusterRoutes, createBusterRoute } from './busterRoutes';

const PATHNAME_TO_ROUTE: Record<string, BusterRoutes> = {
  // [BusterRoutes.APP_CHAT_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_CHAT_ID_METRIC_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_CHAT_ID_COLLECTION_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_CHAT_ID_REASONING_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_CHAT_ID_TERM_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_CHAT_ID_VALUE_ID]: BusterRoutes.APP_CHAT,
  // [BusterRoutes.APP_DASHBOARD_ID]: BusterRoutes.APP_DASHBOARDS,
  // [BusterRoutes.APP_DASHBOARD_ID_FILE]: BusterRoutes.APP_DASHBOARDS,
  // [BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER]: BusterRoutes.APP_DASHBOARDS,
  // [BusterRoutes.APP_COLLECTIONS_ID]: BusterRoutes.APP_COLLECTIONS,
  // [BusterRoutes.APP_DATASETS_ID]: BusterRoutes.APP_DATASETS,
  // [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW]: BusterRoutes.APP_DATASETS,
  // [BusterRoutes.APP_DATASETS_ID_OVERVIEW]: BusterRoutes.APP_DATASETS,
  // [BusterRoutes.APP_DATASETS_ID_EDITOR]: BusterRoutes.APP_DATASETS,
  // [BusterRoutes.APP_TERMS_ID]: BusterRoutes.APP_TERMS
};

export const pathNameToRoute = (
  pathName: string,
  params: Record<string, unknown>
): BusterRoutes => {
  const route = Object.values(BusterRoutes).find((r) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    return r === pathName || createBusterRoute({ route: r, ...(params as any) }) === pathName;
  });

  if (route && PATHNAME_TO_ROUTE[route as string]) {
    return PATHNAME_TO_ROUTE[route as string];
  }

  return route || BusterRoutes.ROOT;
};

const PATHNAME_TO_PARENT_ROUTE: Record<string, BusterRoutes> = {
  [BusterRoutes.APP_CHAT_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_COLLECTION_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_REASONING_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_TERM_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_VALUE_ID]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_METRIC_ID_CHART]: BusterRoutes.APP_METRIC,
  [BusterRoutes.APP_METRIC_ID_RESULTS]: BusterRoutes.APP_METRIC,
  [BusterRoutes.APP_METRIC_ID_FILE__HIDDEN]: BusterRoutes.APP_METRIC,
  [BusterRoutes.APP_METRIC_ID_VERSION_NUMBER]: BusterRoutes.APP_METRIC,
  [BusterRoutes.APP_DASHBOARD_ID]: BusterRoutes.APP_DASHBOARDS,
  [BusterRoutes.APP_DASHBOARD_ID_FILE]: BusterRoutes.APP_DASHBOARDS,
  [BusterRoutes.APP_DASHBOARD_ID_VERSION_NUMBER]: BusterRoutes.APP_DASHBOARDS,
  [BusterRoutes.APP_COLLECTIONS_ID]: BusterRoutes.APP_COLLECTIONS,
  [BusterRoutes.APP_DATASETS_ID]: BusterRoutes.APP_DATASETS,
  [BusterRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW]: BusterRoutes.APP_DATASETS,
  [BusterRoutes.APP_DATASETS_ID_OVERVIEW]: BusterRoutes.APP_DATASETS,
  [BusterRoutes.APP_DATASETS_ID_EDITOR]: BusterRoutes.APP_DATASETS,
  [BusterRoutes.APP_TERMS_ID]: BusterRoutes.APP_TERMS,
  [BusterRoutes.SETTINGS_USERS_ID]: BusterRoutes.SETTINGS_USERS,
  [BusterRoutes.SETTINGS_USERS_ID_DATASETS]: BusterRoutes.SETTINGS_USERS,
  [BusterRoutes.SETTINGS_USERS_ID_PERMISSION_GROUPS]: BusterRoutes.SETTINGS_USERS,
  [BusterRoutes.SETTINGS_USERS_ID_TEAMS]: BusterRoutes.SETTINGS_USERS,
  [BusterRoutes.SETTINGS_USERS_ID_DATASET_GROUPS]: BusterRoutes.SETTINGS_USERS,
  [BusterRoutes.SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS]: BusterRoutes.SETTINGS_DATASET_GROUPS,
  [BusterRoutes.SETTINGS_DATASET_GROUPS_ID_DATASETS]: BusterRoutes.SETTINGS_DATASET_GROUPS,
  [BusterRoutes.SETTINGS_DATASET_GROUPS_ID_USERS]: BusterRoutes.SETTINGS_DATASET_GROUPS,
  [BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS]: BusterRoutes.SETTINGS_PERMISSION_GROUPS,
  [BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS]:
    BusterRoutes.SETTINGS_PERMISSION_GROUPS,
  [BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS]: BusterRoutes.SETTINGS_PERMISSION_GROUPS,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_FILE]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_METRIC_ID_RESULTS]: BusterRoutes.APP_CHAT,
  [BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_FILE]: BusterRoutes.APP_CHAT
};

export const pathNameToParentRoute = (
  pathName: string,
  params: Record<string, unknown>
): BusterRoutes => {
  const route = Object.values(BusterRoutes).find((r) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    return r === pathName || createBusterRoute({ route: r, ...(params as any) }) === pathName;
  });

  if (route && PATHNAME_TO_PARENT_ROUTE[route as string]) {
    return PATHNAME_TO_PARENT_ROUTE[route as string];
  }

  return route || BusterRoutes.ROOT;
};
