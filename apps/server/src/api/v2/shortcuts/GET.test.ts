import { getUserOrganizationId, getUserShortcuts, type User } from '@buster/database/queries';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listShortcutsHandler } from './GET';

// Mock database functions
vi.mock('@buster/database/queries', () => ({
  getUserOrganizationId: vi.fn(),
  getUserShortcuts: vi.fn(),
}));

vi.mock('@buster/database/schema', () => ({
  users: {},
}));

vi.mock('@buster/database/connection', () => ({
  db: {
    select: vi.fn(),
  },
  eq: vi.fn(),
}));

import { db } from '@buster/database/connection';

describe('listShortcutsHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    avatarUrl: null,
  };

  const mockOrgMembership = {
    organizationId: 'org-123',
    role: 'viewer' as const,
  };

  const mockShortcuts = [
    {
      id: 'shortcut-1',
      name: 'alpha-shortcut',
      instructions: 'First shortcut',
      createdBy: 'user-123',
      updatedBy: null,
      organizationId: 'org-123',
      shareWithWorkspace: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: 'shortcut-2',
      name: 'beta-shortcut',
      instructions: 'Second shortcut',
      createdBy: 'user-123',
      updatedBy: null,
      organizationId: 'org-123',
      shareWithWorkspace: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: 'shortcut-3',
      name: 'gamma-shortcut',
      instructions: 'Third shortcut',
      createdBy: 'other-user',
      updatedBy: null,
      organizationId: 'org-123',
      shareWithWorkspace: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserOrganizationId).mockResolvedValue(mockOrgMembership);
    vi.mocked(getUserShortcuts).mockResolvedValue(mockShortcuts);

    // Mock the database select chain for lastUsedShortcuts
    const mockDbChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ lastUsedShortcuts: null }]),
    };
    vi.mocked(db.select).mockReturnValue(mockDbChain as any);
  });

  describe('retrieval scenarios', () => {
    it('should return personal shortcuts only', async () => {
      const personalOnly = mockShortcuts.filter((s) => !s.shareWithWorkspace);
      vi.mocked(getUserShortcuts).mockResolvedValue(personalOnly);

      const result = await listShortcutsHandler(mockUser);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUser.id);
      expect(getUserShortcuts).toHaveBeenCalledWith({
        userId: mockUser.id,
        organizationId: 'org-123',
      });
      expect(result.shortcuts).toHaveLength(2);
      expect(result.shortcuts.every((s) => !s.shareWithWorkspace)).toBe(true);
    });

    it('should return workspace shortcuts only', async () => {
      const workspaceOnly = mockShortcuts.filter((s) => s.shareWithWorkspace);
      vi.mocked(getUserShortcuts).mockResolvedValue(workspaceOnly);

      const result = await listShortcutsHandler(mockUser);

      expect(result.shortcuts).toHaveLength(1);
      expect(result.shortcuts[0]?.shareWithWorkspace).toBe(true);
    });

    it('should return combined personal and workspace shortcuts', async () => {
      const result = await listShortcutsHandler(mockUser);

      expect(result.shortcuts).toHaveLength(3);
      expect(result.shortcuts.some((s) => s.shareWithWorkspace)).toBe(true);
      expect(result.shortcuts.some((s) => !s.shareWithWorkspace)).toBe(true);
    });

    it('should return empty array when no shortcuts exist', async () => {
      vi.mocked(getUserShortcuts).mockResolvedValue([]);

      const result = await listShortcutsHandler(mockUser);

      expect(result.shortcuts).toEqual([]);
    });
  });

  describe('sorting by last used', () => {
    it('should prioritize recently used shortcuts', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue([{ lastUsedShortcuts: ['shortcut-2', 'shortcut-3', 'shortcut-1'] }]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      // Should be sorted by lastUsedShortcuts order
      expect(result.shortcuts[0]?.id).toBe('shortcut-2');
      expect(result.shortcuts[1]?.id).toBe('shortcut-3');
      expect(result.shortcuts[2]?.id).toBe('shortcut-1');
    });

    it('should maintain order of lastUsedShortcuts array', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ lastUsedShortcuts: ['shortcut-3', 'shortcut-1'] }]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      // shortcut-3 and shortcut-1 should be first (in that order)
      // shortcut-2 should be last (alphabetically)
      expect(result.shortcuts[0]?.id).toBe('shortcut-3');
      expect(result.shortcuts[1]?.id).toBe('shortcut-1');
      expect(result.shortcuts[2]?.id).toBe('shortcut-2');
    });

    it('should sort unused shortcuts alphabetically', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ lastUsedShortcuts: [] }]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      // All shortcuts should be sorted alphabetically
      expect(result.shortcuts[0]?.name).toBe('alpha-shortcut');
      expect(result.shortcuts[1]?.name).toBe('beta-shortcut');
      expect(result.shortcuts[2]?.name).toBe('gamma-shortcut');
    });

    it('should handle empty lastUsedShortcuts array', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ lastUsedShortcuts: [] }]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      expect(result.shortcuts).toHaveLength(3);
      // Should fall back to alphabetical order
      expect(result.shortcuts[0]?.name).toBe('alpha-shortcut');
    });

    it('should handle null lastUsedShortcuts', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ lastUsedShortcuts: null }]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      expect(result.shortcuts).toHaveLength(3);
      // Should fall back to alphabetical order
      expect(result.shortcuts[0]?.name).toBe('alpha-shortcut');
    });

    it('should handle invalid shortcut IDs in lastUsedShortcuts', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockResolvedValue([
            { lastUsedShortcuts: ['non-existent-id', 'shortcut-2', 'another-invalid'] },
          ]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      // shortcut-2 should be first (only valid ID in lastUsed)
      // Others should be alphabetical
      expect(result.shortcuts[0]?.id).toBe('shortcut-2');
      expect(result.shortcuts[1]?.name).toBe('alpha-shortcut');
      expect(result.shortcuts[2]?.name).toBe('gamma-shortcut');
    });
  });

  describe('error handling', () => {
    it('should handle missing organization', async () => {
      vi.mocked(getUserOrganizationId).mockResolvedValue(null);

      await expect(listShortcutsHandler(mockUser)).rejects.toThrow(HTTPException);
      await expect(listShortcutsHandler(mockUser)).rejects.toThrow(
        'User must belong to an organization'
      );
    });

    it('should handle database query errors', async () => {
      vi.mocked(getUserShortcuts).mockRejectedValue(new Error('Database connection failed'));

      await expect(listShortcutsHandler(mockUser)).rejects.toThrow(HTTPException);
      await expect(listShortcutsHandler(mockUser)).rejects.toThrow('Failed to fetch shortcuts');
    });

    it('should handle user record fetch error', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(new Error('User fetch failed')),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      await expect(listShortcutsHandler(mockUser)).rejects.toThrow(HTTPException);
      await expect(listShortcutsHandler(mockUser)).rejects.toThrow('Failed to fetch shortcuts');
    });
  });

  describe('mixed scenarios', () => {
    it('should handle mix of used and unused shortcuts', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ lastUsedShortcuts: ['shortcut-3'] }]),
      };
      vi.mocked(db.select).mockReturnValue(mockDbChain as any);

      const result = await listShortcutsHandler(mockUser);

      // shortcut-3 should be first (in lastUsed)
      // Others should be alphabetical
      expect(result.shortcuts[0]?.id).toBe('shortcut-3');
      expect(result.shortcuts[1]?.name).toBe('alpha-shortcut');
      expect(result.shortcuts[2]?.name).toBe('beta-shortcut');
    });
  });
});
