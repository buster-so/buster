import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessControlError } from '../types/errors';
import {
  checkDatasetAccess,
  checkMultipleDatasetAccess,
  getPermissionedDatasets,
} from './permissions';

// Mock database queries
vi.mock('@buster/database', () => ({
  getPermissionedDatasets: vi.fn(),
  hasDatasetAccess: vi.fn(),
  hasAllDatasetsAccess: vi.fn(),
}));

// Mock cache
vi.mock('./cache', () => ({
  getCachedPermissionedDatasets: vi.fn(),
  setCachedPermissionedDatasets: vi.fn(),
  getCachedDatasetAccess: vi.fn(),
  setCachedDatasetAccess: vi.fn(),
}));

describe('Dataset Permissions', () => {
  let mockGetPermissionedDatasets: any;
  let mockHasDatasetAccess: any;
  let mockHasAllDatasetsAccess: any;
  let mockGetCachedPermissionedDatasets: any;
  let mockSetCachedPermissionedDatasets: any;
  let mockGetCachedDatasetAccess: any;
  let mockSetCachedDatasetAccess: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    const db = await import('@buster/database');
    mockGetPermissionedDatasets = vi.mocked(db.getPermissionedDatasets);
    mockHasDatasetAccess = vi.mocked(db.hasDatasetAccess);
    mockHasAllDatasetsAccess = vi.mocked(db.hasAllDatasetsAccess);

    const cache = await import('./cache');
    mockGetCachedPermissionedDatasets = vi.mocked(cache.getCachedPermissionedDatasets);
    mockSetCachedPermissionedDatasets = vi.mocked(cache.setCachedPermissionedDatasets);
    mockGetCachedDatasetAccess = vi.mocked(cache.getCachedDatasetAccess);
    mockSetCachedDatasetAccess = vi.mocked(cache.setCachedDatasetAccess);
  });

  describe('getPermissionedDatasets', () => {
    beforeEach(() => {
      mockGetCachedPermissionedDatasets.mockReturnValue(undefined);
    });

    it('should return cached datasets if available', async () => {
      const cachedResult = {
        datasets: [
          { id: 'ds1', name: 'Dataset 1', organizationId: 'org1' },
          { id: 'ds2', name: 'Dataset 2', organizationId: 'org1' },
        ],
        total: 2,
      };
      mockGetCachedPermissionedDatasets.mockReturnValue(cachedResult);

      const result = await getPermissionedDatasets({
        userId: 'user123',
        page: 0,
        pageSize: 20,
      });

      expect(result).toEqual({
        ...cachedResult,
        page: 0,
        pageSize: 20,
      });
      expect(mockGetPermissionedDatasets).not.toHaveBeenCalled();
    });

    it('should fetch and cache datasets', async () => {
      const dbResult = {
        datasets: [{ id: 'ds1', name: 'Dataset 1', organizationId: 'org1' }],
        total: 1,
      };
      mockGetPermissionedDatasets.mockResolvedValue(dbResult);

      const result = await getPermissionedDatasets({
        userId: 'user123',
        page: 0,
        pageSize: 20,
      });

      expect(result).toEqual({
        ...dbResult,
        page: 0,
        pageSize: 20,
      });
      expect(mockSetCachedPermissionedDatasets).toHaveBeenCalledWith('user123', 0, 20, dbResult);
    });

    it('should handle pagination parameters', async () => {
      mockGetPermissionedDatasets.mockResolvedValue({
        datasets: [],
        total: 100,
      });

      const result = await getPermissionedDatasets({
        userId: 'user123',
        page: 2,
        pageSize: 10,
      });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(mockGetPermissionedDatasets).toHaveBeenCalledWith({
        userId: 'user123',
        page: 2,
        pageSize: 10,
      });
    });

    it('should use default pagination', async () => {
      mockGetPermissionedDatasets.mockResolvedValue({
        datasets: [],
        total: 0,
      });

      await getPermissionedDatasets({ userId: 'user123' });

      expect(mockGetPermissionedDatasets).toHaveBeenCalledWith({
        userId: 'user123',
        page: 0,
        pageSize: 20,
      });
    });

    it('should handle database errors', async () => {
      mockGetPermissionedDatasets.mockRejectedValue(new Error('DB Error'));

      await expect(getPermissionedDatasets({ userId: 'user123' })).rejects.toThrow(
        AccessControlError
      );
    });
  });

  describe('checkDatasetAccess', () => {
    beforeEach(() => {
      mockGetCachedDatasetAccess.mockReturnValue(undefined);
    });

    it('should return cached access result if available', async () => {
      mockGetCachedDatasetAccess.mockReturnValue({
        hasAccess: true,
        accessPath: 'direct_user',
        userRole: 'data_admin',
      });

      const result = await checkDatasetAccess({
        userId: 'user123',
        datasetId: 'ds123',
      });

      expect(result).toEqual({
        hasAccess: true,
        accessPath: 'direct_user',
        userRole: 'data_admin',
      });
      expect(mockHasDatasetAccess).not.toHaveBeenCalled();
    });

    it('should check and cache dataset access', async () => {
      mockHasDatasetAccess.mockResolvedValue({
        hasAccess: true,
        accessPath: 'direct_user',
        userRole: 'data_admin',
      });

      const result = await checkDatasetAccess({
        userId: 'user123',
        datasetId: 'ds123',
      });

      expect(result).toEqual({
        hasAccess: true,
        accessPath: 'direct_user',
        userRole: 'data_admin',
      });
      expect(mockSetCachedDatasetAccess).toHaveBeenCalledWith('user123', 'ds123', {
        hasAccess: true,
        accessPath: 'direct_user',
        userRole: 'data_admin',
      });
    });

    it('should cache false results', async () => {
      mockHasDatasetAccess.mockResolvedValue({
        hasAccess: false,
        accessPath: undefined,
        userRole: undefined,
      });

      const result = await checkDatasetAccess({
        userId: 'user123',
        datasetId: 'ds123',
      });

      expect(result.hasAccess).toBe(false);
      expect(mockSetCachedDatasetAccess).toHaveBeenCalledWith('user123', 'ds123', {
        hasAccess: false,
      });
    });

    it('should handle errors', async () => {
      mockHasDatasetAccess.mockRejectedValue(new Error('DB Error'));

      await expect(
        checkDatasetAccess({
          userId: 'user123',
          datasetId: 'ds123',
        })
      ).rejects.toThrow(AccessControlError);
    });
  });

  describe('checkMultipleDatasetAccess', () => {
    it('should handle empty dataset list', async () => {
      const result = await checkMultipleDatasetAccess({
        userId: 'user123',
        datasetIds: [],
      });

      expect(result).toEqual({
        hasAccessToAll: false,
        details: {},
      });
      expect(mockHasAllDatasetsAccess).not.toHaveBeenCalled();
    });

    it('should check access to multiple datasets', async () => {
      mockHasAllDatasetsAccess.mockResolvedValue({
        hasAccessToAll: false,
        details: {
          ds1: { hasAccess: true, accessPath: 'direct_user' },
          ds2: { hasAccess: true, accessPath: 'user_to_team' },
          ds3: { hasAccess: false },
        },
      });

      const result = await checkMultipleDatasetAccess({
        userId: 'user123',
        datasetIds: ['ds1', 'ds2', 'ds3'],
      });

      expect(result).toEqual({
        hasAccessToAll: false,
        details: {
          ds1: { hasAccess: true, accessPath: 'direct_user' },
          ds2: { hasAccess: true, accessPath: 'user_to_team' },
          ds3: { hasAccess: false },
        },
      });
    });

    it('should indicate when user has access to all datasets', async () => {
      mockHasAllDatasetsAccess.mockResolvedValue({
        hasAccessToAll: true,
        details: {
          ds1: { hasAccess: true, accessPath: 'admin_override' },
          ds2: { hasAccess: true, accessPath: 'admin_override' },
        },
      });

      const result = await checkMultipleDatasetAccess({
        userId: 'user123',
        datasetIds: ['ds1', 'ds2'],
      });

      expect(result.hasAccessToAll).toBe(true);
    });

    it('should handle errors', async () => {
      mockHasAllDatasetsAccess.mockRejectedValue(new Error('DB Error'));

      await expect(
        checkMultipleDatasetAccess({
          userId: 'user123',
          datasetIds: ['ds1'],
        })
      ).rejects.toThrow(AccessControlError);
    });
  });
});
