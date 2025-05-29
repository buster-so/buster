import type { OrganizationUser } from '@/api/asset_interfaces/users';
import { queryOptions } from '@tanstack/react-query';

const organizationUsers = (organizationId: string) =>
  queryOptions<OrganizationUser[]>({
    queryKey: ['organizationUsers', organizationId] as const,
    staleTime: 10 * 1000
  });

export const organizationQueryKeys = {
  '/organizations/users:getOrganizationUsers': organizationUsers
};
