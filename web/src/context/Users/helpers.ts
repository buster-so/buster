import { BusterOrganizationRole, BusterUserResponse } from '@/api/buster_rest';

export const checkIfUserIsAdmin = (userInfo?: BusterUserResponse | null) => {
  return (
    !!userInfo &&
    (userInfo.organizations[0].role === BusterOrganizationRole.DATA_ADMIN ||
      userInfo.organizations[0].role === BusterOrganizationRole.WORKSPACE_ADMIN)
  );
};
