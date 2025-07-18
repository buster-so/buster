import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../envHelpers/env-helpers';

const mockGetOrganizationDataSource = vi.fn();

vi.mock('@buster/database', () => ({
  getOrganizationDataSource: mockGetOrganizationDataSource,
}));

vi.mock('./createTestDataSource', () => ({
  createTestDataSource: vi.fn(),
}));

describe('Organization Data Source Helper - Unit Tests', () => {
  let mockCreateTestDataSource: any;

  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();

    const createTestDataSourceMock = (await vi.importMock('./createTestDataSource')) as any;
    mockCreateTestDataSource = createTestDataSourceMock.createTestDataSource;
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('getOrganizationDataSource returns data source successfully', async () => {
    const mockDataSource = {
      dataSourceId: 'test-data-source-id',
      organizationId: 'test-org-id',
      dataSourceType: 'postgresql',
    };

    const mockResult = {
      dataSourceId: 'test-data-source-id',
      dataSourceSyntax: 'postgresql',
    };

    mockCreateTestDataSource.mockResolvedValue(mockDataSource);
    mockGetOrganizationDataSource.mockResolvedValue(mockResult);

    const { getOrganizationDataSource } = await import('@buster/database');
    const { createTestDataSource } = await import('./createTestDataSource');

    const { dataSourceId, organizationId, dataSourceType } = await createTestDataSource();
    const input = { organizationId };
    const result = await getOrganizationDataSource(input);

    expect(result.dataSourceId).toBe(dataSourceId);
    expect(result.dataSourceSyntax).toBe(dataSourceType);
  });

  test('getOrganizationDataSource validates UUID input', async () => {
    mockGetOrganizationDataSource.mockRejectedValue(
      new Error('Organization ID must be a valid UUID')
    );

    const { getOrganizationDataSource } = await import('@buster/database');
    const input = { organizationId: 'invalid-uuid' };

    await expect(getOrganizationDataSource(input)).rejects.toThrow(
      'Organization ID must be a valid UUID'
    );
  });

  test('getOrganizationDataSource throws for non-existent organization', async () => {
    mockGetOrganizationDataSource.mockRejectedValue(
      new Error('No data sources found for organization')
    );

    const { getOrganizationDataSource } = await import('@buster/database');
    const input = {
      organizationId: '00000000-0000-0000-0000-000000000000',
    };

    await expect(getOrganizationDataSource(input)).rejects.toThrow(
      'No data sources found for organization'
    );
  });

  test('getOrganizationDataSource throws for multiple data sources', async () => {
    const mockDataSource = {
      dataSourceId: 'test-data-source-id',
      organizationId: 'test-org-id',
      dataSourceType: 'postgresql',
    };

    mockCreateTestDataSource.mockResolvedValue(mockDataSource);
    mockGetOrganizationDataSource.mockRejectedValue(
      new Error(
        'Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.'
      )
    );

    const { getOrganizationDataSource } = await import('@buster/database');
    const { createTestDataSource } = await import('./createTestDataSource');

    const { organizationId } = await createTestDataSource();
    await createTestDataSource({ organizationId });

    const input = { organizationId };

    await expect(getOrganizationDataSource(input)).rejects.toThrow(
      'Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.'
    );
  });
});
