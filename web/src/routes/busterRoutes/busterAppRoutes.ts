export enum BusterAppRoutes {
  APP_ROOT = '/app',
  APP_COLLECTIONS = '/app/collections',
  APP_COLLECTIONS_ID = '/app/collections/:collectionId',
  APP_COLLECTIONS_ID_THREADS_ID = '/app/collections/:collectionId/metrics/:threadId',
  APP_THREAD = '/app/metrics',
  APP_THREAD_ID = '/app/metrics/:threadId',
  APP_DASHBOARDS = '/app/dashboards',
  APP_DASHBOARD_ID = '/app/dashboards/:dashboardId',
  APP_DASHBOARD_THREADS = '/app/dashboards/:dashboardId/metrics',
  APP_DASHBOARD_THREADS_ID = '/app/dashboards/:dashboardId/metrics/:threadId',
  APP_LOGS = '/app/logs',
  APP_DATASETS = '/app/datasets',
  APP_DATASETS_ID = '/app/datasets/:datasetId',
  APP_DATASETS_ID_OVERVIEW = '/app/datasets/:datasetId/overview',
  APP_DATASETS_ID_PERMISSIONS_OVERVIEW = '/app/datasets/:datasetId/permissions/overview',
  APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS = '/app/datasets/:datasetId/permissions/permission-groups',
  APP_DATASETS_ID_PERMISSIONS_USERS = '/app/datasets/:datasetId/permissions/users',
  APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS = '/app/datasets/:datasetId/permissions/dataset-groups',
  APP_DATASETS_ID_EDITOR = '/app/datasets/:datasetId/editor',
  APP_TERMS = '/app/terms',
  APP_TERMS_ID = '/app/terms/:termId',
  SETTINGS = '/app/settings',
  SETTINGS_GENERAL = '/app/settings/general',
  SETTINGS_PERMISSIONS = '/app/settings/permissions',
  SETTINGS_STORAGE = '/app/settings/storage',
  SETTINGS_DATASOURCES = '/app/settings/datasources',
  SETTINGS_DATASOURCES_ID = '/app/settings/datasources/:datasourceId',
  SETTINGS_DATASOURCES_ADD = '/app/settings/datasources/add',
  SETTINGS_INTEGRATIONS = '/app/settings/integrations',
  SETTINGS_PERMISSION_GROUPS = '/app/settings/permission-groups',
  SETTINGS_PERMISSION_GROUPS_ID_USERS = '/app/settings/permission-groups/:permissionGroupId/users',
  SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS = '/app/settings/permission-groups/:permissionGroupId/dataset-groups',
  SETTINGS_PERMISSION_GROUPS_ID_DATASETS = '/app/settings/permission-groups/:permissionGroupId/datasets',
  SETTINGS_API_KEYS = '/app/settings/api-keys',
  SETTINGS_EMBEDS = '/app/settings/embeds',
  SETTINGS_BILLING = '/app/settings/billing',
  SETTINGS_PROFILE = '/app/settings/profile',
  SETTINGS_PREFERENCES = '/app/settings/preferences',
  SETTINGS_NOTIFICATIONS = '/app/settings/notifications',
  SETTINGS_TEAM_ID = '/app/settings/team/:teamId',
  APP_SETTINGS_USERS = '/app/settings/users',
  APP_SETTINGS_USERS_ID = '/app/settings/users/:userId',
  APP_SETTINGS_USERS_ID_PERMISSION_GROUPS = '/app/settings/users/:userId/permission-groups',
  APP_SETTINGS_USERS_ID_ATTRIBUTES = '/app/settings/users/:userId/attributes',
  APP_SETTINGS_USERS_ID_DATASETS = '/app/settings/users/:userId/datasets',
  APP_SETTINGS_USERS_ID_DATASET_GROUPS = '/app/settings/users/:userId/dataset-groups',
  APP_SETTINGS_USERS_ID_TEAMS = '/app/settings/users/:userId/teams',
  APP_SETTINGS_DATASETS_ID = '/app/settings/datasets/:datasetId',
  APP_SETTINGS_DATASET_GROUPS = '/app/settings/dataset-groups',
  APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS = '/app/settings/dataset-groups/:datasetGroupId/permission-groups',
  APP_SETTINGS_DATASET_GROUPS_ID_DATASETS = '/app/settings/dataset-groups/:datasetGroupId/datasets',
  APP_SETTINGS_DATASET_GROUPS_ID_USERS = '/app/settings/dataset-groups/:datasetGroupId/users',
  APP_SETTINGS_ATTRIBUTES = '/app/settings/attributes',
  APP_SETTINGS_SECURITY = '/app/settings/security',
  NEW_USER = '/app/new-user',
  APP_INTERNAL = '/app/internal',
  APP_INTERNAL_TRACES = '/app/internal/traces',
  APP_INTERNAL_TRACES_ID = '/app/internal/traces/:sessionId'
}

export type BusterAppRoutesWithArgs = {
  [BusterAppRoutes.APP_ROOT]: { route: BusterAppRoutes.APP_ROOT };
  [BusterAppRoutes.APP_COLLECTIONS]: { route: BusterAppRoutes.APP_COLLECTIONS };
  [BusterAppRoutes.APP_COLLECTIONS_ID]: {
    route: BusterAppRoutes.APP_COLLECTIONS_ID;
    collectionId: string;
  };
  [BusterAppRoutes.APP_THREAD]: { route: BusterAppRoutes.APP_THREAD };
  [BusterAppRoutes.APP_THREAD_ID]: { route: BusterAppRoutes.APP_THREAD_ID; threadId: string };
  [BusterAppRoutes.APP_DASHBOARDS]: { route: BusterAppRoutes.APP_DASHBOARDS };
  [BusterAppRoutes.APP_DASHBOARD_ID]: {
    route: BusterAppRoutes.APP_DASHBOARD_ID;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_DASHBOARD_THREADS]: {
    route: BusterAppRoutes.APP_DASHBOARD_THREADS;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_DASHBOARD_THREADS_ID]: {
    route: BusterAppRoutes.APP_DASHBOARD_THREADS_ID;
    dashboardId: string;
    threadId: string;
  };
  [BusterAppRoutes.APP_DATASETS]: { route: BusterAppRoutes.APP_DATASETS };
  [BusterAppRoutes.APP_TERMS]: { route: BusterAppRoutes.APP_TERMS };
  [BusterAppRoutes.SETTINGS]: { route: BusterAppRoutes.SETTINGS };
  [BusterAppRoutes.SETTINGS_GENERAL]: { route: BusterAppRoutes.SETTINGS_GENERAL };
  [BusterAppRoutes.SETTINGS_PERMISSIONS]: { route: BusterAppRoutes.SETTINGS_PERMISSIONS };
  [BusterAppRoutes.SETTINGS_STORAGE]: { route: BusterAppRoutes.SETTINGS_STORAGE };
  [BusterAppRoutes.SETTINGS_DATASOURCES]: { route: BusterAppRoutes.SETTINGS_DATASOURCES };
  [BusterAppRoutes.SETTINGS_INTEGRATIONS]: { route: BusterAppRoutes.SETTINGS_INTEGRATIONS };
  [BusterAppRoutes.SETTINGS_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.SETTINGS_PERMISSION_GROUPS;
  };
  [BusterAppRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS]: {
    route: BusterAppRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS;
    permissionGroupId: string;
  };
  [BusterAppRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS]: {
    route: BusterAppRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS;
    permissionGroupId: string;
  };
  [BusterAppRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS]: {
    route: BusterAppRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS;
    permissionGroupId: string;
  };
  [BusterAppRoutes.SETTINGS_API_KEYS]: { route: BusterAppRoutes.SETTINGS_API_KEYS };
  [BusterAppRoutes.SETTINGS_EMBEDS]: { route: BusterAppRoutes.SETTINGS_EMBEDS };
  [BusterAppRoutes.SETTINGS_BILLING]: { route: BusterAppRoutes.SETTINGS_BILLING };
  [BusterAppRoutes.SETTINGS_PROFILE]: { route: BusterAppRoutes.SETTINGS_PROFILE };
  [BusterAppRoutes.SETTINGS_PREFERENCES]: { route: BusterAppRoutes.SETTINGS_PREFERENCES };
  [BusterAppRoutes.SETTINGS_NOTIFICATIONS]: { route: BusterAppRoutes.SETTINGS_NOTIFICATIONS };
  [BusterAppRoutes.SETTINGS_TEAM_ID]: { route: BusterAppRoutes.SETTINGS_TEAM_ID; teamId: string };
  [BusterAppRoutes.SETTINGS_DATASOURCES_ID]: {
    route: BusterAppRoutes.SETTINGS_DATASOURCES_ID;
    datasourceId: string;
  };
  [BusterAppRoutes.SETTINGS_DATASOURCES_ADD]: { route: BusterAppRoutes.SETTINGS_DATASOURCES_ADD };
  [BusterAppRoutes.APP_DATASETS_ID]: { route: BusterAppRoutes.APP_DATASETS_ID; datasetId: string };
  [BusterAppRoutes.APP_LOGS]: { route: BusterAppRoutes.APP_LOGS };
  [BusterAppRoutes.APP_TERMS_ID]: { route: BusterAppRoutes.APP_TERMS_ID; termId: string };
  [BusterAppRoutes.APP_DATASETS_ID_OVERVIEW]: {
    route: BusterAppRoutes.APP_DATASETS_ID_OVERVIEW;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_OVERVIEW;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_PERMISSION_GROUPS;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_USERS]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_USERS;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_DATASETS_ID_PERMISSIONS_DATASET_GROUPS;
    datasetId: string;
  };
  [BusterAppRoutes.APP_DATASETS_ID_EDITOR]: {
    route: BusterAppRoutes.APP_DATASETS_ID_EDITOR;
    datasetId: string;
  };
  [BusterAppRoutes.APP_COLLECTIONS_ID_THREADS_ID]: {
    route: BusterAppRoutes.APP_COLLECTIONS_ID_THREADS_ID;
    collectionId: string;
    threadId: string;
  };
  [BusterAppRoutes.NEW_USER]: { route: BusterAppRoutes.NEW_USER };
  [BusterAppRoutes.APP_SETTINGS_USERS]: { route: BusterAppRoutes.APP_SETTINGS_USERS };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_PERMISSION_GROUPS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_ATTRIBUTES;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASETS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASETS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_DATASET_GROUPS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_USERS_ID_TEAMS]: {
    route: BusterAppRoutes.APP_SETTINGS_USERS_ID_TEAMS;
    userId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASETS_ID]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASETS_ID;
    datasetId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS;
    datasetGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_DATASETS;
    datasetGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_USERS]: {
    route: BusterAppRoutes.APP_SETTINGS_DATASET_GROUPS_ID_USERS;
    datasetGroupId: string;
  };
  [BusterAppRoutes.APP_SETTINGS_ATTRIBUTES]: { route: BusterAppRoutes.APP_SETTINGS_ATTRIBUTES };
  [BusterAppRoutes.APP_SETTINGS_SECURITY]: { route: BusterAppRoutes.APP_SETTINGS_SECURITY };
  [BusterAppRoutes.APP_INTERNAL]: { route: BusterAppRoutes.APP_INTERNAL };
  [BusterAppRoutes.APP_INTERNAL_TRACES]: { route: BusterAppRoutes.APP_INTERNAL_TRACES };
  [BusterAppRoutes.APP_INTERNAL_TRACES_ID]: {
    route: BusterAppRoutes.APP_INTERNAL_TRACES_ID;
    sessionId: string;
  };
};
