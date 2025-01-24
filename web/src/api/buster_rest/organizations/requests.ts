import { serverFetch } from '../../createServerInstance';
import { mainApi } from '../instances';
import { OrganizationUser } from './responseInterfaces';

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
