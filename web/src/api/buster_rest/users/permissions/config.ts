export const USER_PERMISSIONS_DATASET_GROUPS_QUERY_KEY = (userId: string) => [
  'user',
  userId,
  'datasetGroups'
];
export const USER_PERMISSIONS_DATASETS_QUERY_KEY = (userId: string) => ['user', userId, 'datasets'];
export const USER_PERMISSIONS_ATTRIBUTES_QUERY_KEY = (userId: string) => [
  'user',
  userId,
  'attributes'
];
export const USER_PERMISSIONS_TEAMS_QUERY_KEY = (userId: string) => ['user', userId, 'teams'];
export const USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY = (userId: string) => [
  'user',
  userId,
  'permissionGroups'
];
