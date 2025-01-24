import { ThreadResponses, ThreadEmits, ThreadResponseTypes } from './threads';
import { DashboardResponseTypes, DashboardEmits, DashboardResponses } from './dashboards';
import { DatasetEmits, DatasetResponseTypes, DatasetResponses } from './datasets';
import { SQLEmits, SQLResponses, SQLResponsesTypes } from './sql';
import { UserEmits, UserResponses, UserResponsesTypes } from './user';
import { CollectionResponseTypes, CollectionResponses, CollectionsEmit } from './collections';
import { TeamEmits } from './user/teamRequests';
import { TeamResponses, TeamResponsesTypes } from './user/teamResponses';
import { DatasourceEmits } from './datasources/datasourceRequests';
import { DatasourceResponseTypes, DatasourceResponses } from './datasources/datasourceResponses';
import { TermsEmits } from './terms';
import { TermsResponses, TermsResponseTypes } from './terms/termsResponses';
import { PermissionsEmits } from './permissions/permissionRequests';
import { PermissionsResponses, PermissionsResponseTypes } from './permissions';
import { BusterSearchEmits, SearchResponses, SearchResponseTypes } from './search';
import {
  OrganizationResponses,
  OrganizationResponsesTypes,
  OrganizationsEmits
} from './organizations';

export type BusterSocketRequest =
  | ThreadEmits
  | DashboardEmits
  | DatasetEmits
  | UserEmits
  | CollectionsEmit
  | TeamEmits
  | DatasourceEmits
  | SQLEmits
  | TermsEmits
  | PermissionsEmits
  | BusterSearchEmits
  | OrganizationsEmits;

export type BusterSocketResponse =
  | ThreadResponseTypes
  | DashboardResponseTypes
  | DatasetResponseTypes
  | UserResponsesTypes
  | CollectionResponseTypes
  | TeamResponsesTypes
  | DatasourceResponseTypes
  | SQLResponsesTypes
  | TermsResponseTypes
  | PermissionsResponseTypes
  | SearchResponseTypes
  | OrganizationResponsesTypes;

export type BusterSocketResponseRoute =
  | keyof typeof ThreadResponses
  | keyof typeof DashboardResponses
  | keyof typeof DatasetResponses
  | keyof typeof UserResponses
  | keyof typeof CollectionResponses
  | keyof typeof TeamResponses
  | keyof typeof DatasourceResponses
  | keyof typeof SQLResponses
  | keyof typeof TermsResponses
  | keyof typeof PermissionsResponses
  | keyof typeof SearchResponses
  | keyof typeof OrganizationResponses;
