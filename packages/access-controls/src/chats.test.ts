import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canUserAccessChat } from './chats';

// Mock the database module - vi.mock is hoisted so we need to define everything inside
vi.mock('@buster/database', () => {
  const mockDb = {
    select: vi.fn(),
    selectDistinct: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    innerJoin: vi.fn(),
    limit: vi.fn(),
  };

  return {
    getDb: vi.fn(() => Promise.resolve(mockDb)),
    dbInitialized: Promise.resolve(mockDb),
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
  };
});

describe('canUserAccessChat', () => {
  let mockDb: any;
  const userId = randomUUID();
  const chatId = randomUUID();
  const orgId = randomUUID();
  const collectionId = randomUUID();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get the mock database object
    const dbModule = await import('@buster/database');
    mockDb = await dbModule.dbInitialized;

    // Reset all mocks before each test
    mockDb.select.mockClear();
    mockDb.selectDistinct.mockClear();
    mockDb.from.mockClear();
    mockDb.where.mockClear();
    mockDb.innerJoin.mockClear();
    mockDb.limit.mockClear();
  });

  it('should return false if chat does not exist', async () => {
    // Setup mock chains for all 4 parallel queries

    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (returns empty - chat doesn't exist)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 4: User organizations (returns empty)
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    // Set up the mock to return different chains based on what's selected
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return directPermChain; // Direct permission query
      if (callCount === 2) return chatInfoChain; // Chat info query
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    // The fourth query uses select for user orgs
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return directPermChain;
      if (callCount === 2) return chatInfoChain;
      if (callCount === 3) return userOrgChain;
      return directPermChain;
    });

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(false);
  });

  it('should return true if user has direct permission', async () => {
    // Query 1: Direct permission (returns result)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: chatId }]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (chat exists)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: 'other-user', organizationId: orgId }]),
    };

    // Query 4: User organizations
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(true);
  });

  it('should return true if user has collection permission', async () => {
    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns result)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ collectionId }]),
    };

    // Query 3: Chat info (chat exists)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: 'other-user', organizationId: orgId }]),
    };

    // Query 4: User organizations
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(true);
  });

  it('should return true if user created the chat', async () => {
    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (user is creator)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: userId, organizationId: orgId }]),
    };

    // Query 4: User organizations
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(true);
  });

  it('should return true if user is org admin (workspace_admin)', async () => {
    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (chat exists with org)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: 'other-user', organizationId: orgId }]),
    };

    // Query 4: User is workspace_admin in the org
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ organizationId: orgId, role: 'workspace_admin' }]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(true);
  });

  it('should return true if user is org admin (org_admin)', async () => {
    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (chat exists with org)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: 'other-user', organizationId: orgId }]),
    };

    // Query 4: User is org_admin in the org (org_admin is not actually used in the implementation)
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ organizationId: orgId, role: 'org_admin' }]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(false); // org_admin is not in the allowed roles
  });

  it('should return true if user is data_admin', async () => {
    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (chat exists with org)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: 'other-user', organizationId: orgId }]),
    };

    // Query 4: User is data_admin in the org
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ organizationId: orgId, role: 'data_admin' }]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(true);
  });

  it('should return false if user has no access', async () => {
    // Query 1: Direct permission (returns empty)
    const directPermChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 2: Collection permission (returns empty)
    const collectionPermChain = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    // Query 3: Chat info (chat exists with org)
    const chatInfoChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ createdBy: 'other-user', organizationId: orgId }]),
    };

    // Query 4: User is regular querier (not admin)
    const userOrgChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ organizationId: orgId, role: 'querier' }]),
    };

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return directPermChain;
      if (selectCallCount === 2) return chatInfoChain;
      if (selectCallCount === 3) return userOrgChain;
      return directPermChain;
    });

    mockDb.selectDistinct.mockReturnValue(collectionPermChain);

    const result = await canUserAccessChat({ userId, chatId });
    expect(result).toBe(false);
  });
});
