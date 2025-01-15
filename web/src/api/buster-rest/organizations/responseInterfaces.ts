export interface OrganizationUser {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'inactive';
  role: 'dataAdmin' | 'workspaceAdmin' | 'querier' | 'restrictedQuerier' | 'viewer';
}
