export interface BusterOrganization {
  created_at: string;
  id: string;
  deleted_at: string | null;
  domain: string;
  name: string;
  updated_at: string;
  role: BusterOrganizationRole;
}

export enum BusterOrganizationRole {
  WORKSPACE_ADMIN = 'workspaceAdmin',
  DATA_ADMIN = 'dataAdmin',
  QUERIER = 'querier',
  RESTRICTED_QUERIER = 'restrictedQuerier',
  VIEWER = 'viewer'
}

export const BusterOrganizationRoleLabels = {
  [BusterOrganizationRole.WORKSPACE_ADMIN]: 'Workspace Admin',
  [BusterOrganizationRole.DATA_ADMIN]: 'Data Admin',
  [BusterOrganizationRole.QUERIER]: 'Querier',
  [BusterOrganizationRole.RESTRICTED_QUERIER]: 'Restricted Querier',
  [BusterOrganizationRole.VIEWER]: 'Viewer'
};
