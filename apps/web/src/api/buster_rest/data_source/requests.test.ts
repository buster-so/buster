import type { GetDataSourceResponse } from '@buster/server-shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { mainApiV2 } from '../instances';
import { getDatasource } from './requests';

// Mock dependencies
vi.mock('../instances', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
  mainApiV2: {
    get: vi.fn(),
  },
}));

describe('data_source requests', () => {
  const mockDataSource: GetDataSourceResponse = {
    id: 'test-id',
    name: 'Test Database',
    type: 'postgres',
    organizationId: 'org-id',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    deletedAt: null,
    onboardingStatus: 'completed',
    onboardingError: null,
    createdBy: {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
    },
    credentials: {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test_user',
      password: 'password',
      default_database: 'test_db',
      default_schema: 'public',
    },
    datasets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDatasource', () => {
    it('should throw an error when the API request fails', async () => {
      // Setup mock error
      const mockError = new Error('Request failed');
      (mainApiV2.get as any).mockRejectedValue(mockError);

      // Call and expect error
      await expect(getDatasource('test-id')).rejects.toThrow('Request failed');
      expect(mainApiV2.get).toHaveBeenCalledWith('/data-sources/test-id');
    });
  });
});
