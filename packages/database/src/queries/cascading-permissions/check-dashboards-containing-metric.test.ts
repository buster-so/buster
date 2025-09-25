import { beforeEach, describe, expect, it, vi } from 'vitest';
import { checkDashboardsContainingMetric } from './check-dashboards-containing-metric';

// Mock the database connection
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock drizzle-orm
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    sql: actual.sql,
    and: vi.fn((...conditions) => ({ _and: conditions })),
    eq: vi.fn((a, b) => ({ _eq: [a, b] })),
    isNull: vi.fn((field) => ({ _isNull: field })),
  };
});

describe('checkDashboardsContainingMetric', () => {
  const mockDb = {
    select: vi.fn(),
  };

  const mockQueryChain = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    where: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup the mock chain
    mockDb.select.mockReturnValue(mockQueryChain);
    mockQueryChain.from.mockReturnValue(mockQueryChain);
    mockQueryChain.innerJoin.mockReturnValue(mockQueryChain);
    mockQueryChain.where.mockReturnValue(Promise.resolve([]));

    // Set up the mock db
    const connection = await import('../../connection');
    vi.mocked(connection.db).select = mockDb.select;
  });

  it('should return dashboards with organizationId and workspaceSharing', async () => {
    const mockDashboards = [
      {
        id: 'dash1',
        organizationId: 'org1',
        workspaceSharing: 'can_view',
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
      {
        id: 'dash2',
        organizationId: 'org2',
        workspaceSharing: 'none',
        publiclyAccessible: true,
        publicExpiryDate: '2024-12-31T23:59:59Z',
        publicPassword: 'secret456',
      },
      {
        id: 'dash3',
        organizationId: 'org1',
        workspaceSharing: null,
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
    ];

    mockQueryChain.where.mockResolvedValue(mockDashboards);

    const result = await checkDashboardsContainingMetric('metric123');

    expect(result).toEqual(mockDashboards);
    expect(mockDb.select).toHaveBeenCalledWith({
      id: expect.anything(),
      organizationId: expect.anything(),
      workspaceSharing: expect.anything(),
      publiclyAccessible: expect.anything(),
      publicExpiryDate: expect.anything(),
      publicPassword: expect.anything(),
    });
    expect(mockQueryChain.from).toHaveBeenCalled();
    expect(mockQueryChain.innerJoin).toHaveBeenCalled();
    expect(mockQueryChain.where).toHaveBeenCalled();
  });

  it('should return empty array when no dashboards contain the metric', async () => {
    mockQueryChain.where.mockResolvedValue([]);

    const result = await checkDashboardsContainingMetric('metric123');

    expect(result).toEqual([]);
  });

  it('should handle null workspace sharing values', async () => {
    const mockDashboards = [
      {
        id: 'dash1',
        organizationId: 'org1',
        workspaceSharing: null,
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
    ];

    mockQueryChain.where.mockResolvedValue(mockDashboards);

    const result = await checkDashboardsContainingMetric('metric123');

    expect(result).toEqual([
      {
        id: 'dash1',
        organizationId: 'org1',
        workspaceSharing: null,
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
    ]);
  });

  it('should handle all workspace sharing levels', async () => {
    const mockDashboards = [
      {
        id: 'dash1',
        organizationId: 'org1',
        workspaceSharing: 'none',
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
      {
        id: 'dash2',
        organizationId: 'org1',
        workspaceSharing: 'can_view',
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
      {
        id: 'dash3',
        organizationId: 'org1',
        workspaceSharing: 'can_edit',
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
      {
        id: 'dash4',
        organizationId: 'org1',
        workspaceSharing: 'full_access',
        publiclyAccessible: false,
        publicExpiryDate: null,
        publicPassword: null,
      },
    ];

    mockQueryChain.where.mockResolvedValue(mockDashboards);

    const result = await checkDashboardsContainingMetric('metric123');

    expect(result).toEqual(mockDashboards);
  });
});
