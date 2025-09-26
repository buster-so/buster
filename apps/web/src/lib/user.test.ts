import { describe, expect, it } from 'vitest';
import { checkIfUserIsAdmin } from './user';

describe('checkIfUserIsAdmin', () => {
  it('should return false when userOrganization is undefined', () => {
    expect(checkIfUserIsAdmin(undefined)).toBe(false);
  });

  it('should return false when userOrganization is null', () => {
    expect(checkIfUserIsAdmin(null)).toBe(false);
  });

  it('should return true when user role is data_admin', () => {
    const userOrganization = { role: 'data_admin' as const };
    expect(checkIfUserIsAdmin(userOrganization)).toBe(true);
  });

  it('should return true when user role is workspace_admin', () => {
    const userOrganization = { role: 'workspace_admin' as const };
    expect(checkIfUserIsAdmin(userOrganization)).toBe(true);
  });

  it('should return false when user role is neither data_admin nor workspace_admin', () => {
    const userOrganization = { role: 'restricted_querier' as const };
    expect(checkIfUserIsAdmin(userOrganization)).toBe(false);
  });
});
