import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessControlError } from '../types/errors';
import { findUserByEmail, findUsersByEmails, searchUsers } from './lookup';

// Mock database functions
vi.mock('@buster/database', () => ({
  findUserByEmail: vi.fn(),
  findUsersByEmails: vi.fn(),
  searchUsers: vi.fn(),
  // TODO: Add createUser when implemented
  // createUser: vi.fn(),
}));

describe('User Lookup Utilities', () => {
  let mockDbFindUserByEmail: any;
  let mockDbFindUsersByEmails: any;
  let mockDbSearchUsers: any;
  let mockCreateUser: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const db = await import('@buster/database');
    mockDbFindUserByEmail = vi.mocked(db.findUserByEmail);
    mockDbFindUsersByEmails = vi.mocked(db.findUsersByEmails);
    mockDbSearchUsers = vi.mocked(db.searchUsers);
    // TODO: Mock createUser when implemented
    // mockCreateUser = vi.mocked(db.createUser);
  });

  describe('findUserByEmail', () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    it('should find existing user', async () => {
      mockDbFindUserByEmail.mockResolvedValue(mockUser);

      const result = await findUserByEmail('test@example.com');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        avatarUrl: mockUser.avatarUrl,
      });
      expect(mockDbFindUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      mockDbFindUserByEmail.mockResolvedValue(null);

      const result = await findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should validate email format', async () => {
      await expect(findUserByEmail('notanemail')).rejects.toThrow(AccessControlError);

      await expect(findUserByEmail('notanemail')).rejects.toThrow('Invalid email address');
    });

    it.skip('should create user if requested and not found', async () => {
      // TODO: Enable this test when createUser is implemented
      // mockDbFindUserByEmail.mockResolvedValueOnce(null); // First call - not found
      // mockCreateUser.mockResolvedValue({ id: 'newuser123' });
      // ...
    });

    it('should handle user creation not implemented', async () => {
      mockDbFindUserByEmail.mockResolvedValueOnce(null); // Not found

      await expect(findUserByEmail('new@example.com', { createIfNotExists: true })).rejects.toThrow(
        'User creation not yet implemented'
      );
    });

    it('should handle database errors', async () => {
      mockDbFindUserByEmail.mockRejectedValue(new Error('DB Error'));

      await expect(findUserByEmail('test@example.com')).rejects.toThrow(AccessControlError);
    });
  });

  describe('findUsersByEmails', () => {
    it('should find multiple users', async () => {
      const userMap = new Map([
        [
          'user1@example.com',
          { id: 'user1', email: 'user1@example.com', name: 'User 1', avatarUrl: null },
        ],
        [
          'user2@example.com',
          { id: 'user2', email: 'user2@example.com', name: 'User 2', avatarUrl: null },
        ],
      ]);
      mockDbFindUsersByEmails.mockResolvedValue(userMap);

      const result = await findUsersByEmails([
        'user1@example.com',
        'user2@example.com',
        'notfound@example.com',
      ]);

      expect(result.users).toHaveLength(2);
      expect(result.notFound).toEqual(['notfound@example.com']);
      expect(result.created).toEqual([]);
    });

    it('should validate all email formats', async () => {
      await expect(findUsersByEmails(['valid@example.com', 'notanemail'])).rejects.toThrow(
        'Invalid email address: notanemail'
      );
    });

    it('should handle empty email list', async () => {
      const result = await findUsersByEmails([]);

      expect(result).toEqual({
        users: [],
        notFound: [],
        created: [],
      });
      expect(mockDbFindUsersByEmails).not.toHaveBeenCalled();
    });

    it.skip('should create missing users if requested', async () => {
      // TODO: Enable this test when createUser is implemented
      // const userMap = new Map([
      //   ['existing@example.com', { id: 'user1', email: 'existing@example.com', name: 'Existing', avatarUrl: null }],
      // ]);
      // ...
    });

    it.skip('should handle creation failures', async () => {
      // TODO: Enable this test when createUser is implemented
      // const userMap = new Map();
      // mockDbFindUsersByEmails.mockResolvedValue(userMap);
      // ...
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockUsers = [
        { id: 'user1', email: 'john@example.com', name: 'John Doe', avatarUrl: null },
        { id: 'user2', email: 'jane@example.com', name: 'Jane Doe', avatarUrl: null },
      ];
      mockDbSearchUsers.mockResolvedValue(mockUsers);

      const result = await searchUsers('john');

      expect(result).toEqual([
        { id: 'user1', email: 'john@example.com', name: 'John Doe', avatarUrl: null },
        { id: 'user2', email: 'jane@example.com', name: 'Jane Doe', avatarUrl: null },
      ]);
      expect(mockDbSearchUsers).toHaveBeenCalledWith('john', 10);
    });

    it('should respect limit parameter', async () => {
      mockDbSearchUsers.mockResolvedValue([]);

      await searchUsers('test', { limit: 50 });

      expect(mockDbSearchUsers).toHaveBeenCalledWith('test', 50);
    });

    it('should use default limit', async () => {
      mockDbSearchUsers.mockResolvedValue([]);

      await searchUsers('test');

      expect(mockDbSearchUsers).toHaveBeenCalledWith('test', 10);
    });

    it('should handle empty results', async () => {
      mockDbSearchUsers.mockResolvedValue([]);

      const result = await searchUsers('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockDbSearchUsers.mockRejectedValue(new Error('DB Error'));

      await expect(searchUsers('test')).rejects.toThrow(AccessControlError);
    });
  });
});
