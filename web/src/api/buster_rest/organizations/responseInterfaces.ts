export interface OrganizationUser {
  id: string;
  email: string;
  name: string | null;
  status: 'active' | 'inactive';
  role: 'dataAdmin' | 'workspaceAdmin' | 'querier' | 'restrictedQuerier' | 'viewer';
  datasets: OrganizationUserDataset[];
}

export interface OrganizationUserDataset {
  can_query: boolean;
  id: string;
  name: string;
  lineage: {
    name: string;
    id: string;
    type: 'user' | 'datasets' | 'permissionGroups';
  }[][];
}
