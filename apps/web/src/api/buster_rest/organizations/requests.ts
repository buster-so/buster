import type { BusterOrganization } from '@/api/asset_interfaces/organizations';
import type { OrganizationUser } from '@/api/asset_interfaces/users';
import { serverFetch } from '../../createServerInstance';
import { mainApi } from '../instances';

export const getOrganizationUsers = async ({
  organizationId
}: {
  organizationId: string;
}): Promise<OrganizationUser[]> => {
  return mainApi
    .get<OrganizationUser[]>(`/organizations/${organizationId}/users`)
    .then((response) => response.data);
};

export const getOrganizationUsers_server = async ({
  organizationId
}: {
  organizationId: string;
}): Promise<OrganizationUser[]> => {
  return serverFetch<OrganizationUser[]>(`/organizations/${organizationId}/users`);
};

export const createOrganization = async (organization: { name: string }) => {
  return mainApi.post<BusterOrganization>('/organizations', organization).then((res) => res.data);
};
