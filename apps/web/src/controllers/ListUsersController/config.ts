import type { OrganizationUser } from '@buster/server-shared/organization';

export const OrganizationUserStatusText: Record<OrganizationUser['status'], string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  guest: 'Guest',
};
