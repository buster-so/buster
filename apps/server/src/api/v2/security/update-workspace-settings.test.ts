import { db } from '@buster/database/connection';
import type { UserOrganizationRole } from '@buster/database/schema-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as securityUtils from './security-utils';
import { createTestOrganization, createTestUser } from './test-fixtures';
import { updateWorkspaceSettingsHandler } from './update-workspace-settings';
import { WorkspaceSettingsService } from './workspace-settings-service';

// Mock dependencies
vi.mock('./security-utils');
vi.mock('./workspace-settings-service', () => {
  const WorkspaceSettingsService = vi.fn();
  WorkspaceSettingsService.prototype.buildUpdateData = vi.fn();
  WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse = vi.fn();
  return { WorkspaceSettingsService };
});
vi.mock('@buster/database/connection', () => ({
  db: {
    update: vi.fn(),
    set: vi.fn(),
    where: vi.fn(),
  },
  organizations: {},
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

vi.mock('@buster/database/schema', () => ({
  organizations: {},
  chats: {},
  collections: {},
  dashboardFiles: {},
  reportFiles: {},
  metricFiles: {},
  users: {},
  datasets: {},
  dataSources: {},
  eq: vi.fn(),
  and: vi.fn(),
  isNull: vi.fn(),
}));

describe('updateWorkspaceSettingsHandler', () => {
  const mockUser = createTestUser();
  const mockOrg = createTestOrganization({
    id: 'org-123',
    restrictNewUserInvitations: false,
    defaultRole: 'restricted_querier',
  });
  const mockOrgMembership = { organizationId: 'org-123', role: 'workspace_admin' as const };
  const mockDefaultDatasets = [
    { id: 'dataset-1', name: 'Sales Data' },
    { id: 'dataset-2', name: 'Customer Data' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(mockOrgMembership);
    vi.mocked(securityUtils.checkWorkspaceAdminPermission).mockImplementation(() => {});
    vi.mocked(securityUtils.fetchOrganization).mockResolvedValue(mockOrg);
    vi.mocked(securityUtils.updateDefaultDatasets).mockResolvedValue(undefined);
    vi.mocked(securityUtils.fetchDefaultDatasets).mockResolvedValue(mockDefaultDatasets);

    // Setup workspace settings service mocks
    vi.mocked(WorkspaceSettingsService.prototype.buildUpdateData).mockReturnValue({
      updatedAt: '2024-01-01T00:00:00Z',
      restrictNewUserInvitations: true,
    });
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: mockDefaultDatasets,
    });

    // Mock database update
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);
  });

  it('should update all settings fields', async () => {
    const request = {
      restrict_new_user_invitations: true,
      default_role: 'data_admin' as UserOrganizationRole,
    };

    vi.mocked(WorkspaceSettingsService.prototype.buildUpdateData).mockReturnValue({
      updatedAt: '2024-01-01T00:00:00Z',
      restrictNewUserInvitations: true,
      defaultRole: 'data_admin' as UserOrganizationRole,
    });
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: true,
      default_role: 'data_admin' as UserOrganizationRole,
      default_datasets: mockDefaultDatasets,
    });

    const result = await updateWorkspaceSettingsHandler(request, mockUser);

    expect(securityUtils.validateUserOrganization).toHaveBeenCalledWith(mockUser.id);
    expect(securityUtils.checkWorkspaceAdminPermission).toHaveBeenCalledWith('workspace_admin');
    expect(WorkspaceSettingsService.prototype.buildUpdateData).toHaveBeenCalledWith(request);

    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'data_admin',
      default_datasets: mockDefaultDatasets,
    });
  });

  it('should handle partial updates correctly', async () => {
    const request = { restrict_new_user_invitations: true };

    const result = await updateWorkspaceSettingsHandler(request, mockUser);

    expect(WorkspaceSettingsService.prototype.buildUpdateData).toHaveBeenCalledWith(request);

    expect(result).toEqual({
      restrict_new_user_invitations: true,
      default_role: 'restricted_querier',
      default_datasets: mockDefaultDatasets,
    });
  });

  it('should update database with new settings', async () => {
    const request = { default_role: 'data_admin' as UserOrganizationRole };
    const mockDbChain = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(db.update).mockReturnValue(mockDbChain as any);

    vi.mocked(WorkspaceSettingsService.prototype.buildUpdateData).mockReturnValue({
      updatedAt: '2024-01-01T00:00:00Z',
      defaultRole: 'data_admin' as UserOrganizationRole,
    });
    vi.mocked(WorkspaceSettingsService.prototype.formatWorkspaceSettingsResponse).mockReturnValue({
      restrict_new_user_invitations: false,
      default_role: 'data_admin' as UserOrganizationRole,
      default_datasets: mockDefaultDatasets,
    });

    await updateWorkspaceSettingsHandler(request, mockUser);

    expect(db.update).toHaveBeenCalled();
    expect(mockDbChain.set).toHaveBeenCalledWith({
      updatedAt: '2024-01-01T00:00:00Z',
      defaultRole: 'data_admin' satisfies UserOrganizationRole,
    });
  });

  it('should fetch updated organization after update', async () => {
    const request = { restrict_new_user_invitations: true };

    await updateWorkspaceSettingsHandler(request, mockUser);

    expect(securityUtils.fetchOrganization).toHaveBeenCalledTimes(1);
    expect(securityUtils.fetchOrganization).toHaveBeenCalledWith('org-123');
  });

  it('should handle validation errors', async () => {
    vi.mocked(securityUtils.validateUserOrganization).mockRejectedValue(
      new Error('User not in organization')
    );

    const request = { restrict_new_user_invitations: true };

    await expect(updateWorkspaceSettingsHandler(request, mockUser)).rejects.toThrow(
      'Failed to update workspace settings'
    );
  });

  it('should handle permission errors', async () => {
    vi.mocked(securityUtils.checkWorkspaceAdminPermission).mockImplementation(() => {
      throw new Error('Only workspace admins can update settings');
    });

    const request = { restrict_new_user_invitations: true };

    await expect(updateWorkspaceSettingsHandler(request, mockUser)).rejects.toThrow(
      'Failed to update workspace settings'
    );
  });

  it('should reject non-workspace-admin users', async () => {
    const nonAdminMembership = { organizationId: 'org-123', role: 'data_admin' as const };
    vi.mocked(securityUtils.validateUserOrganization).mockResolvedValue(nonAdminMembership);
    vi.mocked(securityUtils.checkWorkspaceAdminPermission).mockImplementation((role) => {
      if (role !== 'workspace_admin') {
        throw new Error('Only workspace admins can update settings');
      }
    });

    const request = { restrict_new_user_invitations: true };

    await expect(updateWorkspaceSettingsHandler(request, mockUser)).rejects.toThrow(
      'Failed to update workspace settings'
    );
  });

  it('should update default datasets with specific IDs', async () => {
    const request = {
      default_datasets_ids: ['dataset-1', 'dataset-2'],
    };

    await updateWorkspaceSettingsHandler(request, mockUser);

    expect(securityUtils.updateDefaultDatasets).toHaveBeenCalledWith(
      'org-123',
      ['dataset-1', 'dataset-2'],
      mockUser.id
    );
    expect(securityUtils.fetchDefaultDatasets).toHaveBeenCalledWith('org-123');
  });

  it('should update default datasets with "all" keyword', async () => {
    const request = {
      default_datasets_ids: ['all'],
    };

    await updateWorkspaceSettingsHandler(request, mockUser);

    expect(securityUtils.updateDefaultDatasets).toHaveBeenCalledWith('org-123', 'all', mockUser.id);
  });

  it('should not update default datasets when not provided', async () => {
    const request = {
      restrict_new_user_invitations: true,
    };

    await updateWorkspaceSettingsHandler(request, mockUser);

    expect(securityUtils.updateDefaultDatasets).not.toHaveBeenCalled();
    // But should still fetch them for the response
    expect(securityUtils.fetchDefaultDatasets).toHaveBeenCalledWith('org-123');
  });

  it('should handle empty default datasets array', async () => {
    const request = {
      default_datasets_ids: [],
    };

    await updateWorkspaceSettingsHandler(request, mockUser);

    expect(securityUtils.updateDefaultDatasets).toHaveBeenCalledWith('org-123', [], mockUser.id);
  });
});
