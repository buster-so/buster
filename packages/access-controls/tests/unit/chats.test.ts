import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canUserAccessChat } from '../../src/chats';

// Mock the database module
vi.mock('@buster/database', () => ({
  getDb: vi.fn(),
  and: vi.fn((...args) => ({ _and: args })),
  eq: vi.fn((a, b) => ({ _eq: [a, b] })),
  isNull: vi.fn((a) => ({ _isNull: a })),
  assetPermissions: {
    assetId: 'assetId',
    assetType: 'assetType',
    identityId: 'identityId',
    identityType: 'identityType',
    deletedAt: 'deletedAt',
  },
  collectionsToAssets: {
    collectionId: 'collectionId',
    assetId: 'assetId',
    assetType: 'assetType',
    deletedAt: 'deletedAt',
  },
  chats: {
    id: 'id',
    createdBy: 'createdBy',
    organizationId: 'organizationId',
    deletedAt: 'deletedAt',
  },
  usersToOrganizations: {
    userId: 'userId',
    organizationId: 'organizationId',
    role: 'role',
    deletedAt: 'deletedAt',
  },
}));

describe('canUserAccessChat', () => {
  let getDb: any;
  let mockDb: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked module
    const dbModule = await import('@buster/database');
    getDb = vi.mocked(dbModule.getDb);

    // Create a fresh mock database object for each test
    const mockSelect = vi.fn();
    const mockSelectDistinct = vi.fn();
    const mockFrom = vi.fn();
    const mockWhere = vi.fn();
    const mockInnerJoin = vi.fn();
    const mockLimit = vi.fn();

    // Setup the chain
    mockLimit.mockResolvedValue([]);
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockInnerJoin.mockReturnValue({ where: mockWhere });
    mockFrom.mockReturnValue({ 
      where: mockWhere,
      innerJoin: mockInnerJoin 
    });
    mockSelect.mockReturnValue({ from: mockFrom });
    mockSelectDistinct.mockReturnValue({ from: mockFrom });

    mockDb = {
      select: mockSelect,
      selectDistinct: mockSelectDistinct,
      _mockLimit: mockLimit,
      _mockWhere: mockWhere,
      _mockFrom: mockFrom,
      _mockInnerJoin: mockInnerJoin,
    };

    getDb.mockReturnValue(mockDb);
  });

  it('should return false if chat does not exist', async () => {
    // All queries return empty arrays
    mockDb._mockLimit.mockResolvedValue([]);
    
    const result = await canUserAccessChat({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(false);
    expect(getDb).toHaveBeenCalled();
  });

  it('should return true if user has direct permission', async () => {
    let callCount = 0;
    mockDb._mockLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Direct permission check - has permission
        return Promise.resolve([{ id: 'chat-id' }]);
      } else if (callCount === 3) {
        // Chat info
        return Promise.resolve([{
          createdBy: 'other-user',
          organizationId: 'org-id',
        }]);
      }
      return Promise.resolve([]);
    });

    mockDb._mockWhere.mockImplementation((...args) => {
      // For user organizations query (doesn't use limit)
      if (mockDb._mockWhere.mock.calls.length === 4) {
        return Promise.resolve([]);
      }
      return { limit: mockDb._mockLimit };
    });

    const result = await canUserAccessChat({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(true);
  });

  it('should return true if user has collection permission', async () => {
    let callCount = 0;
    mockDb._mockLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        // Collection permission check - has permission
        return Promise.resolve([{ collectionId: 'collection-id' }]);
      } else if (callCount === 3) {
        // Chat info
        return Promise.resolve([{
          createdBy: 'other-user',
          organizationId: 'org-id',
        }]);
      }
      return Promise.resolve([]);
    });

    mockDb._mockWhere.mockImplementation(() => {
      // For user organizations query (doesn't use limit)
      if (mockDb._mockWhere.mock.calls.length === 4) {
        return Promise.resolve([]);
      }
      return { limit: mockDb._mockLimit };
    });

    const result = await canUserAccessChat({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(true);
  });

  it('should return true if user is the creator', async () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';
    
    let callCount = 0;
    mockDb._mockLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 3) {
        // Chat info - user is creator
        return Promise.resolve([{
          createdBy: userId,
          organizationId: 'org-id',
        }]);
      }
      return Promise.resolve([]);
    });

    mockDb._mockWhere.mockImplementation(() => {
      // For user organizations query (doesn't use limit)
      if (mockDb._mockWhere.mock.calls.length === 4) {
        return Promise.resolve([]);
      }
      return { limit: mockDb._mockLimit };
    });

    const result = await canUserAccessChat({
      userId,
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(true);
  });

  it('should return true if user is workspace_admin', async () => {
    const orgId = 'org-123';
    
    let callCount = 0;
    mockDb._mockLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 3) {
        // Chat info
        return Promise.resolve([{
          createdBy: 'other-user',
          organizationId: orgId,
        }]);
      }
      return Promise.resolve([]);
    });

    mockDb._mockWhere.mockImplementation(() => {
      // For user organizations query (doesn't use limit)
      if (mockDb._mockWhere.mock.calls.length === 4) {
        return Promise.resolve([{
          organizationId: orgId,
          role: 'workspace_admin',
        }]);
      }
      return { limit: mockDb._mockLimit };
    });

    const result = await canUserAccessChat({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(true);
  });

  it('should return true if user is data_admin', async () => {
    const orgId = 'org-123';
    
    let callCount = 0;
    mockDb._mockLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 3) {
        // Chat info
        return Promise.resolve([{
          createdBy: 'other-user',
          organizationId: orgId,
        }]);
      }
      return Promise.resolve([]);
    });

    mockDb._mockWhere.mockImplementation(() => {
      // For user organizations query (doesn't use limit)
      if (mockDb._mockWhere.mock.calls.length === 4) {
        return Promise.resolve([{
          organizationId: orgId,
          role: 'data_admin',
        }]);
      }
      return { limit: mockDb._mockLimit };
    });

    const result = await canUserAccessChat({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(true);
  });

  it('should return false if user has no access', async () => {
    const orgId = 'org-123';
    
    let callCount = 0;
    mockDb._mockLimit.mockImplementation(() => {
      callCount++;
      if (callCount === 3) {
        // Chat info exists
        return Promise.resolve([{
          createdBy: 'other-user',
          organizationId: orgId,
        }]);
      }
      return Promise.resolve([]);
    });

    mockDb._mockWhere.mockImplementation(() => {
      // For user organizations query (doesn't use limit)
      if (mockDb._mockWhere.mock.calls.length === 4) {
        return Promise.resolve([{
          organizationId: orgId,
          role: 'viewer', // Not an admin role
        }]);
      }
      return { limit: mockDb._mockLimit };
    });

    const result = await canUserAccessChat({
      userId: '123e4567-e89b-12d3-a456-426614174000',
      chatId: '223e4567-e89b-12d3-a456-426614174000',
    });

    expect(result).toBe(false);
  });

  it('should validate input UUIDs', async () => {
    await expect(
      canUserAccessChat({
        userId: 'invalid-uuid',
        chatId: '223e4567-e89b-12d3-a456-426614174000',
      })
    ).rejects.toThrow();

    await expect(
      canUserAccessChat({
        userId: '123e4567-e89b-12d3-a456-426614174000',
        chatId: 'invalid-uuid',
      })
    ).rejects.toThrow();
  });
});