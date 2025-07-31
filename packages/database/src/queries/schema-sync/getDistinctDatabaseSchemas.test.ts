import { describe, expect, it } from 'vitest';
import type { Dataset } from './getDatasetsWithYmlContent';
import { getDistinctDatabaseSchemas } from './getDistinctDatabaseSchemas';

describe('getDistinctDatabaseSchemas', () => {
  it('should return empty array for empty input', () => {
    const result = getDistinctDatabaseSchemas([]);
    expect(result).toEqual([]);
  });

  it('should group datasets by database and schema', () => {
    const mockDatasets: Dataset[] = [
      {
        id: '1',
        name: 'dataset1',
        databaseName: 'analytics',
        schema: 'sales',
        enabled: true,
        ymlFile: 'content1',
      } as Dataset,
      {
        id: '2',
        name: 'dataset2',
        databaseName: 'analytics',
        schema: 'sales',
        enabled: true,
        ymlFile: 'content2',
      } as Dataset,
      {
        id: '3',
        name: 'dataset3',
        databaseName: 'analytics',
        schema: 'marketing',
        enabled: true,
        ymlFile: 'content3',
      } as Dataset,
      {
        id: '4',
        name: 'dataset4',
        databaseName: 'reporting',
        schema: 'public',
        enabled: true,
        ymlFile: 'content4',
      } as Dataset,
    ];

    const result = getDistinctDatabaseSchemas(mockDatasets);

    expect(result).toHaveLength(3);

    // Check first group (analytics.sales)
    const salesGroup = result.find(
      (g) => g.databaseSchema.database === 'analytics' && g.databaseSchema.schema === 'sales'
    );
    expect(salesGroup).toBeDefined();
    expect(salesGroup?.datasets).toHaveLength(2);
    expect(salesGroup?.datasets.map((d) => d.id)).toContain('1');
    expect(salesGroup?.datasets.map((d) => d.id)).toContain('2');

    // Check second group (analytics.marketing)
    const marketingGroup = result.find(
      (g) => g.databaseSchema.database === 'analytics' && g.databaseSchema.schema === 'marketing'
    );
    expect(marketingGroup).toBeDefined();
    expect(marketingGroup?.datasets).toHaveLength(1);
    expect(marketingGroup?.datasets[0]?.id).toBe('3');

    // Check third group (reporting.public)
    const reportingGroup = result.find(
      (g) => g.databaseSchema.database === 'reporting' && g.databaseSchema.schema === 'public'
    );
    expect(reportingGroup).toBeDefined();
    expect(reportingGroup?.datasets).toHaveLength(1);
    expect(reportingGroup?.datasets[0]?.id).toBe('4');
  });

  it('should handle datasets with same database but different schemas', () => {
    const mockDatasets: Dataset[] = [
      {
        id: '1',
        name: 'dataset1',
        databaseName: 'mydb',
        schema: 'schema1',
        enabled: true,
        ymlFile: 'content1',
      } as Dataset,
      {
        id: '2',
        name: 'dataset2',
        databaseName: 'mydb',
        schema: 'schema2',
        enabled: true,
        ymlFile: 'content2',
      } as Dataset,
    ];

    const result = getDistinctDatabaseSchemas(mockDatasets);

    expect(result).toHaveLength(2);
    expect(result[0]?.databaseSchema).toEqual({ database: 'mydb', schema: 'schema1' });
    expect(result[1]?.databaseSchema).toEqual({ database: 'mydb', schema: 'schema2' });
  });
});
