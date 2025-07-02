import { chatQueryKeys } from './chat';
import { collectionQueryKeys } from './collection';
import { dashboardQueryKeys } from './dashboard';
import { datasetGroupQueryKeys } from './dataset_groups';
import { datasetQueryKeys } from './datasets';
import { datasourceQueryKeys } from './datasources';
import { metricsQueryKeys } from './metric';
import { currencyQueryKeys } from './currency';
import { permissionGroupQueryKeys } from './permission_groups';
import { searchQueryKeys } from './search';
import { termsQueryKeys } from './terms';
import { userQueryKeys } from './users';

export const queryKeys = {
  ...datasetQueryKeys,
  ...chatQueryKeys,
  ...collectionQueryKeys,
  ...userQueryKeys,
  ...dashboardQueryKeys,
  ...metricsQueryKeys,
  ...searchQueryKeys,
  ...termsQueryKeys,
  ...datasourceQueryKeys,
  ...datasetGroupQueryKeys,
  ...permissionGroupQueryKeys,
  ...currencyQueryKeys
};
