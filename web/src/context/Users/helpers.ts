import { BusterOrganizationRole, BusterUserResponse } from '@/api/buster_rest';

export const checkIfUserIsAdmin = (userInfo?: BusterUserResponse | null): boolean => {
  if (!userInfo) return false;

  const userOrganization = userInfo?.organizations?.[0];

  if (!userOrganization) return false;

  const userRole = userOrganization.role;

  return (
    userRole === BusterOrganizationRole.DATA_ADMIN ||
    userRole === BusterOrganizationRole.WORKSPACE_ADMIN
  );
};
