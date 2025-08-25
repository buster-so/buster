export enum BusterSettingsRoutes {
  SETTINGS = '/app/settings',
  SETTINGS_PERMISSIONS = '/app/settings/permissions',
  SETTINGS_STORAGE = '/app/settings/storage',
  SETTINGS_STORAGE_ADD = '/app/settings/storage/add',
  SETTINGS_STORAGE_PROVIDER = '/app/settings/storage/:storageId',
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
  SETTINGS_USERS = '/app/settings/users',
  SETTINGS_USERS_ID = '/app/settings/users/:userId',
  SETTINGS_USERS_ID_PERMISSION_GROUPS = '/app/settings/users/:userId/permission-groups',
  SETTINGS_USERS_ID_ATTRIBUTES = '/app/settings/users/:userId/attributes',
  SETTINGS_USERS_ID_DATASETS = '/app/settings/users/:userId/datasets',
  SETTINGS_USERS_ID_DATASET_GROUPS = '/app/settings/users/:userId/dataset-groups',
  SETTINGS_USERS_ID_TEAMS = '/app/settings/users/:userId/teams',
  SETTINGS_DATASETS_ID = '/app/settings/datasets/:datasetId',
  SETTINGS_DATASET_GROUPS = '/app/settings/dataset-groups',
  SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS = '/app/settings/dataset-groups/:datasetGroupId/permission-groups',
  SETTINGS_DATASET_GROUPS_ID_DATASETS = '/app/settings/dataset-groups/:datasetGroupId/datasets',
  SETTINGS_DATASET_GROUPS_ID_USERS = '/app/settings/dataset-groups/:datasetGroupId/users',
  SETTINGS_ATTRIBUTES = '/app/settings/attributes',
  SETTINGS_SECURITY = '/app/settings/security',
  SETTINGS_WORKSPACE = '/app/settings/workspace'
}

export type BusterSettingsRoutesWithArgs = {
  [BusterSettingsRoutes.SETTINGS]: { route: BusterSettingsRoutes.SETTINGS };
  [BusterSettingsRoutes.SETTINGS_PERMISSIONS]: { route: BusterSettingsRoutes.SETTINGS_PERMISSIONS };
  [BusterSettingsRoutes.SETTINGS_STORAGE]: { route: BusterSettingsRoutes.SETTINGS_STORAGE };
  [BusterSettingsRoutes.SETTINGS_STORAGE_ADD]: { route: BusterSettingsRoutes.SETTINGS_STORAGE_ADD };
  [BusterSettingsRoutes.SETTINGS_STORAGE_PROVIDER]: {
    route: BusterSettingsRoutes.SETTINGS_STORAGE_PROVIDER;
    storageId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASOURCES]: { route: BusterSettingsRoutes.SETTINGS_DATASOURCES };
  [BusterSettingsRoutes.SETTINGS_INTEGRATIONS]: {
    route: BusterSettingsRoutes.SETTINGS_INTEGRATIONS;
  };
  [BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS]: {
    route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS;
  };
  [BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS]: {
    route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS;
    permissionGroupId: string;
  };
  [BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS]: {
    route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASET_GROUPS;
    permissionGroupId: string;
  };
  [BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS]: {
    route: BusterSettingsRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS;
    permissionGroupId: string;
  };
  [BusterSettingsRoutes.SETTINGS_API_KEYS]: { route: BusterSettingsRoutes.SETTINGS_API_KEYS };
  [BusterSettingsRoutes.SETTINGS_EMBEDS]: { route: BusterSettingsRoutes.SETTINGS_EMBEDS };
  [BusterSettingsRoutes.SETTINGS_BILLING]: { route: BusterSettingsRoutes.SETTINGS_BILLING };
  [BusterSettingsRoutes.SETTINGS_PROFILE]: { route: BusterSettingsRoutes.SETTINGS_PROFILE };
  [BusterSettingsRoutes.SETTINGS_PREFERENCES]: { route: BusterSettingsRoutes.SETTINGS_PREFERENCES };
  [BusterSettingsRoutes.SETTINGS_NOTIFICATIONS]: {
    route: BusterSettingsRoutes.SETTINGS_NOTIFICATIONS;
  };
  [BusterSettingsRoutes.SETTINGS_TEAM_ID]: {
    route: BusterSettingsRoutes.SETTINGS_TEAM_ID;
    teamId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASOURCES_ID]: {
    route: BusterSettingsRoutes.SETTINGS_DATASOURCES_ID;
    datasourceId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASOURCES_ADD]: {
    route: BusterSettingsRoutes.SETTINGS_DATASOURCES_ADD;
  };
  [BusterSettingsRoutes.SETTINGS_USERS]: { route: BusterSettingsRoutes.SETTINGS_USERS };
  [BusterSettingsRoutes.SETTINGS_USERS_ID]: {
    route: BusterSettingsRoutes.SETTINGS_USERS_ID;
    userId: string;
  };
  [BusterSettingsRoutes.SETTINGS_USERS_ID_PERMISSION_GROUPS]: {
    route: BusterSettingsRoutes.SETTINGS_USERS_ID_PERMISSION_GROUPS;
    userId: string;
  };
  [BusterSettingsRoutes.SETTINGS_USERS_ID_ATTRIBUTES]: {
    route: BusterSettingsRoutes.SETTINGS_USERS_ID_ATTRIBUTES;
    userId: string;
  };
  [BusterSettingsRoutes.SETTINGS_USERS_ID_DATASETS]: {
    route: BusterSettingsRoutes.SETTINGS_USERS_ID_DATASETS;
    userId: string;
  };
  [BusterSettingsRoutes.SETTINGS_USERS_ID_DATASET_GROUPS]: {
    route: BusterSettingsRoutes.SETTINGS_USERS_ID_DATASET_GROUPS;
    userId: string;
  };
  [BusterSettingsRoutes.SETTINGS_USERS_ID_TEAMS]: {
    route: BusterSettingsRoutes.SETTINGS_USERS_ID_TEAMS;
    userId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASETS_ID]: {
    route: BusterSettingsRoutes.SETTINGS_DATASETS_ID;
    datasetId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASET_GROUPS]: {
    route: BusterSettingsRoutes.SETTINGS_DATASET_GROUPS;
  };
  [BusterSettingsRoutes.SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS]: {
    route: BusterSettingsRoutes.SETTINGS_DATASET_GROUPS_ID_PERMISSION_GROUPS;
    datasetGroupId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASET_GROUPS_ID_DATASETS]: {
    route: BusterSettingsRoutes.SETTINGS_DATASET_GROUPS_ID_DATASETS;
    datasetGroupId: string;
  };
  [BusterSettingsRoutes.SETTINGS_DATASET_GROUPS_ID_USERS]: {
    route: BusterSettingsRoutes.SETTINGS_DATASET_GROUPS_ID_USERS;
    datasetGroupId: string;
  };
  [BusterSettingsRoutes.SETTINGS_ATTRIBUTES]: { route: BusterSettingsRoutes.SETTINGS_ATTRIBUTES };
  [BusterSettingsRoutes.SETTINGS_SECURITY]: { route: BusterSettingsRoutes.SETTINGS_SECURITY };
  [BusterSettingsRoutes.SETTINGS_WORKSPACE]: { route: BusterSettingsRoutes.SETTINGS_WORKSPACE };
};
