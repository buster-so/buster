import { v4 as uuidv4 } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessControlsError } from './types';
import { buildAccessQuery, formatPermissionName, isValidUuid } from './utils';

// Mock the database module - vi.mock is hoisted so we need to define everything inside
vi.mock('@buster/database', () => {
  // Create a proper chainable mock inside the factory
  const createChainableMock = () => {
    const mock: any = {};

    const methods = [
      'select',
      'from',
      'where',
      'limit',
      'offset',
      'orderBy',
      'innerJoin',
      'selectDistinct',
    ];

    for (const method of methods) {
      mock[method] = vi.fn().mockReturnValue(mock);
    }

    // Override specific methods that should return data
    mock._resolveWith = (data: any) => {
      mock.limit.mockResolvedValue(data);
      mock.where.mockResolvedValue(data);
      mock.offset.mockResolvedValue(data);
      // Also make sure the chainable methods return promises when needed
      mock.limit.mockReturnValue(Promise.resolve(data));
      mock.where.mockReturnValue(Promise.resolve(data));
      mock.offset.mockReturnValue(Promise.resolve(data));
      return mock;
    };

    return mock;
  };

  const mockDbInstance = createChainableMock();

  return {
    getDb: vi.fn(() => Promise.resolve(mockDbInstance)),
    dbInitialized: Promise.resolve(mockDbInstance),
    and: vi.fn((...args) => ({ type: 'and', args })),
    eq: vi.fn((a, b) => ({ type: 'eq', a, b })),
    isNull: vi.fn((field) => ({ type: 'isNull', field })),
    inArray: vi.fn((field, array) => ({ type: 'inArray', field, array })),
    count: vi.fn(() => ({ type: 'count' })),
    usersToOrganizations: {},
    datasets: {},
    permissionGroups: {},
    datasetsToPermissionGroups: {},
    datasetPermissions: {},
    permissionGroupsToIdentities: {},
    teamsToUsers: {},
  };
});

describe('Access Controls Unit Tests - Organization Default Permission Group', () => {
  const testUserId = uuidv4();
  const testOrgId = uuidv4();
  const testDefaultGroupId = uuidv4();
  const testDatasetId1 = uuidv4();
  const testDatasetId2 = uuidv4();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset module cache to ensure fresh imports
    vi.resetModules();
  });

  describe('getPermissionedDatasets', () => {
    it('should validate user ID is a valid UUID', async () => {
      const { getPermissionedDatasets } = await import('./access-controls');

      await expect(getPermissionedDatasets('invalid-uuid', 0, 10)).rejects.toThrow();
    });

    it('should validate pagination parameters', async () => {
      const { getPermissionedDatasets } = await import('./access-controls');

      await expect(getPermissionedDatasets(testUserId, -1, 10)).rejects.toThrow();
      await expect(getPermissionedDatasets(testUserId, 0, 0)).rejects.toThrow();
      await expect(getPermissionedDatasets(testUserId, 0, 1001)).rejects.toThrow();
    });

    it('should return empty array when user has no organization', async () => {
      // Get the dbInitialized mock
      const dbModule = await import('@buster/database');
      const mockDb = await dbModule.dbInitialized;

      // Mock for user organization query (returns empty)
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      const { getPermissionedDatasets } = await import('./access-controls');
      const result = await getPermissionedDatasets(testUserId, 0, 10);

      expect(result).toEqual([]);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return datasets for admin users', async () => {
      // Get the dbInitialized mock
      const dbModule = await import('@buster/database');
      const mockDb = await dbModule.dbInitialized;

      // Mock for user organization query - returns admin user
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([
        {
          organizationId: testOrgId,
          role: 'data_admin',
        },
      ]);

      // Mock for datasets query
      const mockDatasets = [
        {
          id: testDatasetId1,
          name: 'Dataset 1',
          ymlFile: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          dataSourceId: uuidv4(),
        },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockReturnValueOnce(mockDb);
      mockDb.limit.mockReturnValueOnce(mockDb);
      mockDb.offset.mockResolvedValueOnce(mockDatasets);

      const { getPermissionedDatasets } = await import('./access-controls');
      const result = await getPermissionedDatasets(testUserId, 0, 10);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(testDatasetId1);
    });
  });

  describe('hasDatasetAccess', () => {
    it('should validate dataset ID is a valid UUID', async () => {
      const { hasDatasetAccess } = await import('./access-controls');

      await expect(hasDatasetAccess(testUserId, 'invalid-uuid')).rejects.toThrow();
    });

    it('should return false when dataset is deleted', async () => {
      // Get the dbInitialized mock
      const dbModule = await import('@buster/database');
      const mockDb = await dbModule.dbInitialized;

      // Clear previous mock calls
      vi.clearAllMocks();

      // Mock dataset query to return deleted dataset
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([
        {
          organizationId: testOrgId,
          deletedAt: new Date().toISOString(),
        },
      ]);

      const { hasDatasetAccess } = await import('./access-controls');
      const result = await hasDatasetAccess(testUserId, testDatasetId1);

      expect(result).toBe(false);
    });
  });

  describe('hasAllDatasetsAccess', () => {
    it('should return false for empty dataset array', async () => {
      const { hasAllDatasetsAccess } = await import('./access-controls');

      const result = await hasAllDatasetsAccess(testUserId, []);

      expect(result).toBe(false);
    });

    it('should validate all dataset IDs are valid UUIDs', async () => {
      const { hasAllDatasetsAccess } = await import('./access-controls');

      await expect(
        hasAllDatasetsAccess(testUserId, [testDatasetId1, 'invalid-uuid'])
      ).rejects.toThrow();
    });

    it('should return false when not all datasets exist', async () => {
      // Get the dbInitialized mock
      const dbModule = await import('@buster/database');
      const mockDb = await dbModule.dbInitialized;

      // Clear previous mock calls
      vi.clearAllMocks();

      // Mock dataset query to return fewer datasets than requested
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([
        {
          id: testDatasetId1,
          organizationId: testOrgId,
          deletedAt: null,
        },
      ]);

      const { hasAllDatasetsAccess } = await import('./access-controls');
      const result = await hasAllDatasetsAccess(testUserId, [testDatasetId1, testDatasetId2]);

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Get the dbInitialized mock
      const dbModule = await import('@buster/database');
      const mockDb = await dbModule.dbInitialized;

      // Clear previous mock calls
      vi.clearAllMocks();

      // Mock database error
      mockDb.select.mockRejectedValueOnce(new Error('Database connection failed'));

      const { getPermissionedDatasets } = await import('./access-controls');

      await expect(getPermissionedDatasets(testUserId, 0, 10)).rejects.toThrow();
    });
  });
});

describe('AccessControlsError', () => {
  it('should create an error with message and code', () => {
    const error = new AccessControlsError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AccessControlsError');
  });

  it('should create an error with just a message', () => {
    const error = new AccessControlsError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.code).toBeUndefined();
    expect(error.name).toBe('AccessControlsError');
  });
});

describe('Utils', () => {
  describe('formatPermissionName', () => {
    it('should format permission name correctly', () => {
      const result = formatPermissionName('Dataset', 'Read');
      expect(result).toBe('dataset:read');
    });

    it('should handle lowercase inputs', () => {
      const result = formatPermissionName('dashboard', 'write');
      expect(result).toBe('dashboard:write');
    });
  });

  describe('buildAccessQuery', () => {
    it('should build query object with userId and resourceType', () => {
      const result = buildAccessQuery('user-123', 'dataset');

      expect(result).toEqual({
        userId: 'user-123',
        resourceType: 'dataset',
      });
    });
  });

  describe('isValidUuid', () => {
    it('should validate correct UUID', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(isValidUuid(validUuid)).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(isValidUuid('invalid-uuid')).toBe(false);
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('123')).toBe(false);
    });
  });
});
