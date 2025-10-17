import type { User } from '@buster/database/queries';
import type { Shortcut } from '@buster/server-shared/shortcuts';
import { describe, expect, it } from 'vitest';
import {
  canChangeSharing,
  canCreateWorkspaceShortcut,
  canDeleteShortcut,
  canModifyShortcut,
  canViewShortcut,
  type UserOrganization,
} from './shortcut-permissions';

describe('shortcut-permissions', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockShortcut: Shortcut = {
    id: 'shortcut-123',
    name: 'test-shortcut',
    instructions: 'Test instructions',
    createdBy: 'user-123',
    updatedBy: null,
    organizationId: 'org-123',
    shareWithWorkspace: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };

  describe('canCreateWorkspaceShortcut', () => {
    it('should return true for workspace_admin', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'workspace_admin',
      };
      expect(canCreateWorkspaceShortcut(userOrg)).toBe(true);
    });

    it('should return true for data_admin', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'data_admin',
      };
      expect(canCreateWorkspaceShortcut(userOrg)).toBe(true);
    });

    it('should return false for querier', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'querier',
      };
      expect(canCreateWorkspaceShortcut(userOrg)).toBe(false);
    });

    it('should return false for viewer', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'viewer',
      };
      expect(canCreateWorkspaceShortcut(userOrg)).toBe(false);
    });
  });

  describe('canModifyShortcut', () => {
    describe('personal shortcuts', () => {
      const personalShortcut = { ...mockShortcut, shareWithWorkspace: false };

      it('should allow creator to modify their own personal shortcut', () => {
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canModifyShortcut(mockUser, personalShortcut, userOrg)).toBe(true);
      });

      it('should not allow other users to modify personal shortcut', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canModifyShortcut(otherUser, personalShortcut, userOrg)).toBe(false);
      });

      it('should not allow even admins to modify others personal shortcuts', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'workspace_admin',
        };
        expect(canModifyShortcut(otherUser, personalShortcut, userOrg)).toBe(false);
      });
    });

    describe('workspace shortcuts', () => {
      const workspaceShortcut = { ...mockShortcut, shareWithWorkspace: true };

      it('should allow workspace_admin to modify any workspace shortcut', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'workspace_admin',
        };
        expect(canModifyShortcut(otherUser, workspaceShortcut, userOrg)).toBe(true);
      });

      it('should allow data_admin to modify any workspace shortcut', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'data_admin',
        };
        expect(canModifyShortcut(otherUser, workspaceShortcut, userOrg)).toBe(true);
      });

      it('should allow creator to modify their workspace shortcut', () => {
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canModifyShortcut(mockUser, workspaceShortcut, userOrg)).toBe(true);
      });

      it('should not allow non-creator viewers to modify workspace shortcuts', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canModifyShortcut(otherUser, workspaceShortcut, userOrg)).toBe(false);
      });
    });

    describe('cross-organization', () => {
      it('should not allow modification of shortcuts from different organization', () => {
        const otherOrgShortcut = { ...mockShortcut, organizationId: 'other-org' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'workspace_admin',
        };
        expect(canModifyShortcut(mockUser, otherOrgShortcut, userOrg)).toBe(false);
      });
    });
  });

  describe('canDeleteShortcut', () => {
    // Delete uses same logic as modify, so basic tests to ensure it works
    it('should allow creator to delete their personal shortcut', () => {
      const personalShortcut = { ...mockShortcut, shareWithWorkspace: false };
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'viewer',
      };
      expect(canDeleteShortcut(mockUser, personalShortcut, userOrg)).toBe(true);
    });

    it('should allow admin to delete workspace shortcut', () => {
      const workspaceShortcut = { ...mockShortcut, shareWithWorkspace: true };
      const otherUser = { ...mockUser, id: 'other-user' };
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'workspace_admin',
      };
      expect(canDeleteShortcut(otherUser, workspaceShortcut, userOrg)).toBe(true);
    });
  });

  describe('canChangeSharing', () => {
    it('should return true for workspace_admin', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'workspace_admin',
      };
      expect(canChangeSharing(userOrg)).toBe(true);
    });

    it('should return true for data_admin', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'data_admin',
      };
      expect(canChangeSharing(userOrg)).toBe(true);
    });

    it('should return false for viewer', () => {
      const userOrg: UserOrganization = {
        organizationId: 'org-123',
        role: 'viewer',
      };
      expect(canChangeSharing(userOrg)).toBe(false);
    });
  });

  describe('canViewShortcut', () => {
    describe('personal shortcuts', () => {
      const personalShortcut = { ...mockShortcut, shareWithWorkspace: false };

      it('should allow creator to view their personal shortcut', () => {
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canViewShortcut(mockUser, personalShortcut, userOrg)).toBe(true);
      });

      it('should not allow others to view personal shortcut', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canViewShortcut(otherUser, personalShortcut, userOrg)).toBe(false);
      });
    });

    describe('workspace shortcuts', () => {
      const workspaceShortcut = { ...mockShortcut, shareWithWorkspace: true };

      it('should allow any org viewer to view workspace shortcut', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canViewShortcut(otherUser, workspaceShortcut, userOrg)).toBe(true);
      });

      it('should allow viewer role to view workspace shortcut', () => {
        const otherUser = { ...mockUser, id: 'other-user' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'viewer',
        };
        expect(canViewShortcut(otherUser, workspaceShortcut, userOrg)).toBe(true);
      });
    });

    describe('cross-organization', () => {
      it('should not allow viewing shortcuts from different organization', () => {
        const otherOrgShortcut = { ...mockShortcut, organizationId: 'other-org' };
        const userOrg: UserOrganization = {
          organizationId: 'org-123',
          role: 'workspace_admin',
        };
        expect(canViewShortcut(mockUser, otherOrgShortcut, userOrg)).toBe(false);
      });
    });
  });
});
