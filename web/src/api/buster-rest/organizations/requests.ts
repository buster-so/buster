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
