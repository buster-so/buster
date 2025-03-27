export enum BusterAppRoutes {
  APP_HOME = '/app/home',
  APP_COLLECTIONS = '/app/collections',
  APP_COLLECTIONS_ID = '/app/collections/:collectionId',
  APP_COLLECTIONS_ID_METRICS_ID = '/app/collections/:collectionId/metrics/:metricId',
  APP_METRIC = '/app/metrics',
  APP_METRIC_ID = '/app/metrics/:metricId',
  APP_DASHBOARDS = '/app/dashboards',
  APP_DASHBOARD_ID = '/app/dashboards/:dashboardId',
  APP_DASHBOARD_METRICS = '/app/dashboards/:dashboardId/metrics',
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

  //NEW CHAT
  APP_CHAT = '/app/chats',
  APP_CHAT_ID = '/app/chats/:chatId',
  APP_CHAT_ID_QUERY = '/app/chats/:chatId?metricId=:metricId&dashboardId=:dashboardId&messageId=:messageId',
  APP_CHAT_ID_REASONING_ID = '/app/chats/:chatId/reasoning/:messageId',
  APP_CHAT_ID_METRIC_ID = '/app/chats/:chatId/metrics/:metricId',
  APP_CHAT_ID_COLLECTION_ID = '/app/chats/:chatId/collections/:collectionId',
  APP_CHAT_ID_DASHBOARD_ID = '/app/chats/:chatId/dashboards/:dashboardId',
  APP_CHAT_ID_DATASET_ID = '/app/chats/:chatId/datasets/:datasetId',
  APP_CHAT_ID_TERM_ID = '/app/chats/:chatId/term/:termId',
  APP_CHAT_ID_VALUE_ID = '/app/chats/:chatId/value/:valueId',
  APP_VALUE_ID = '/app/value/:valueId',
  NEW_USER = '/app/new-user'
}

export type BusterAppRoutesWithArgs = {
  [BusterAppRoutes.APP_HOME]: { route: BusterAppRoutes.APP_HOME };
  [BusterAppRoutes.APP_COLLECTIONS]: { route: BusterAppRoutes.APP_COLLECTIONS };
  [BusterAppRoutes.APP_COLLECTIONS_ID]: {
    route: BusterAppRoutes.APP_COLLECTIONS_ID;
    collectionId: string;
  };
  [BusterAppRoutes.APP_METRIC]: { route: BusterAppRoutes.APP_METRIC };
  [BusterAppRoutes.APP_METRIC_ID]: { route: BusterAppRoutes.APP_METRIC_ID; metricId: string };
  [BusterAppRoutes.APP_DASHBOARDS]: { route: BusterAppRoutes.APP_DASHBOARDS };
  [BusterAppRoutes.APP_DASHBOARD_ID]: {
    route: BusterAppRoutes.APP_DASHBOARD_ID;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_DASHBOARD_METRICS]: {
    route: BusterAppRoutes.APP_DASHBOARD_METRICS;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_DATASETS]: { route: BusterAppRoutes.APP_DATASETS };
  [BusterAppRoutes.APP_TERMS]: { route: BusterAppRoutes.APP_TERMS };
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
  [BusterAppRoutes.APP_COLLECTIONS_ID_METRICS_ID]: {
    route: BusterAppRoutes.APP_COLLECTIONS_ID_METRICS_ID;
    collectionId: string;
    metricId: string;
  };
  [BusterAppRoutes.NEW_USER]: { route: BusterAppRoutes.NEW_USER };
  [BusterAppRoutes.APP_CHAT]: { route: BusterAppRoutes.APP_CHAT };
  [BusterAppRoutes.APP_CHAT_ID]: { route: BusterAppRoutes.APP_CHAT_ID; chatId: string };
  [BusterAppRoutes.APP_CHAT_ID_QUERY]: {
    route: BusterAppRoutes.APP_CHAT_ID_QUERY;
    chatId: string;
    metricId?: string;
    dashboardId?: string;
    messageId?: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_REASONING_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_REASONING_ID;
    chatId: string;
    messageId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_METRIC_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_METRIC_ID;
    chatId: string;
    metricId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_COLLECTION_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_COLLECTION_ID;
    chatId: string;
    collectionId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_DASHBOARD_ID;
    chatId: string;
    dashboardId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_DATASET_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_DATASET_ID;
    chatId: string;
    datasetId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_TERM_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_TERM_ID;
    chatId: string;
    termId: string;
  };
  [BusterAppRoutes.APP_CHAT_ID_VALUE_ID]: {
    route: BusterAppRoutes.APP_CHAT_ID_VALUE_ID;
    chatId: string;
    valueId: string;
  };
  [BusterAppRoutes.APP_METRIC_ID]: { route: BusterAppRoutes.APP_METRIC_ID; metricId: string };
  [BusterAppRoutes.APP_VALUE_ID]: { route: BusterAppRoutes.APP_VALUE_ID; valueId: string };
};
