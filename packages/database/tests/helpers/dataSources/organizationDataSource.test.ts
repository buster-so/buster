import { cleanupTestEnvironment, setupTestEnvironment } from '@buster/test-utils';
import { createTestDataSource } from '@buster/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  type OrganizationDataSourceInput,
  getOrganizationDataSource,
} from '../../../src/helpers/dataSources/organizationDataSource';

describe('Organization Data Source Helper', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('getOrganizationDataSource returns data source successfully', async () => {
    const { dataSourceId, organizationId, dataSourceType } = await createTestDataSource();

    const input: OrganizationDataSourceInput = { organizationId };
    const result = await getOrganizationDataSource(input);

    expect(result.dataSourceId).toBe(dataSourceId);
    expect(result.dataSourceSyntax).toBe(dataSourceType);
  });

  test('getOrganizationDataSource validates UUID input', async () => {
    const input: OrganizationDataSourceInput = { organizationId: 'invalid-uuid' };

    await expect(getOrganizationDataSource(input)).rejects.toThrow(
      'Organization ID must be a valid UUID'
    );
  });

  test('getOrganizationDataSource throws for non-existent organization', async () => {
    const input: OrganizationDataSourceInput = {
      organizationId: '00000000-0000-0000-0000-000000000000',
    };

    await expect(getOrganizationDataSource(input)).rejects.toThrow(
      'No data sources found for organization'
    );
  });

  test('getOrganizationDataSource throws for multiple data sources', async () => {
    // Create two data sources for the same organization
    const { organizationId } = await createTestDataSource();
    await createTestDataSource({ organizationId });

    const input: OrganizationDataSourceInput = { organizationId };

    await expect(getOrganizationDataSource(input)).rejects.toThrow(
      'Multiple data sources found for organization. Data source selection is not available yet - please contact support if you need to work with multiple data sources.'
    );
  });
});
