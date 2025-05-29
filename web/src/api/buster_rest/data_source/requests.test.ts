import {
  type DataSource,
  DataSourceSchema,
  DataSourceTypes
} from '@/api/asset_interfaces/datasources';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import mainApi from '../instances';
import { getDatasource } from './requests';

// Mock dependencies
vi.mock('../instances', () => ({
  __esModule: true,
  default: {
    get: vi.fn()
  }
}));

// Mock the DataSourceSchema
vi.mock('@/api/asset_interfaces/datasources', async () => {
  const actual = await vi.importActual('@/api/asset_interfaces/datasources');
  return {
    ...actual,
    DataSourceSchema: {
      parse: vi.fn()
    }
  };
});

describe('data_source requests', () => {
  const mockDataSource = {
    id: 'test-id',
    name: 'Test Database',
    type: DataSourceTypes.postgres,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    created_by: {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com'
    },
    credentials: {
      type: DataSourceTypes.postgres,
      host: 'localhost',
      port: 5432,
      username: 'test_user',
      password: 'password',
      default_database: 'test_db',
      default_schema: 'public'
    },
    data_sets: []
  } satisfies DataSource;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDatasource', () => {
    it('should fetch a data source by id', async () => {
      // Setup mock response
      (mainApi.get as any).mockResolvedValue({
        data: mockDataSource
      });

      // Setup schema validation mock
      (DataSourceSchema.parse as any).mockReturnValue(mockDataSource);

      const result = await getDatasource('test-id');

      expect(mainApi.get).toHaveBeenCalledWith('/data_sources/test-id');
      expect(DataSourceSchema.parse).toHaveBeenCalledWith(mockDataSource);
      expect(result).toEqual(mockDataSource);
    });

    it('should throw an error when the API request fails', async () => {
      // Setup mock error
      const mockError = new Error('Request failed');
      (mainApi.get as any).mockRejectedValue(mockError);

      // Call and expect error
      await expect(getDatasource('test-id')).rejects.toThrow('Request failed');
      expect(mainApi.get).toHaveBeenCalledWith('/data_sources/test-id');
    });

    it('should throw an error when validation fails', async () => {
      // Setup mock response with invalid data
      (mainApi.get as any).mockResolvedValue({
        data: { invalid: 'data' }
      });

      // Setup validation error
      const validationError = new Error('Validation failed');
      (DataSourceSchema.parse as any).mockImplementation(() => {
        throw validationError;
      });

      // Call and expect error
      await expect(getDatasource('test-id')).rejects.toThrow('Validation failed');
      expect(mainApi.get).toHaveBeenCalledWith('/data_sources/test-id');
      expect(DataSourceSchema.parse).toHaveBeenCalled();
    });
  });
});
