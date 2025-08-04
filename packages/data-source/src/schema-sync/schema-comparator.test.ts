import { describe, expect, it } from 'vitest';
import type { Column } from '../types/introspection';
import {
  categorizeDiscrepancies,
  compareSchemaWithYml,
  dedupDiscrepancies,
} from './schema-comparator';
import type { YmlColumnInfo } from './yml-parser';

describe('schema-comparator', () => {
  describe('compareSchemaWithYml', () => {
    const datasetInfo = {
      datasetId: '123',
      datasetName: 'test_dataset',
      tableName: 'test_table',
    };

    it('should detect missing columns', () => {
      const introspectedColumns: Column[] = [
        { name: 'id', dataType: 'INTEGER', nullable: false } as Column,
        { name: 'name', dataType: 'VARCHAR(255)', nullable: true } as Column,
      ];

      const ymlColumns: YmlColumnInfo[] = [
        { name: 'id', type: 'number', source: 'dimension' },
        { name: 'name', type: 'string', source: 'dimension' },
        { name: 'email', type: 'string', source: 'dimension' }, // Missing in DB
        { name: 'total', type: 'number', source: 'measure' }, // Missing in DB
      ];

      const discrepancies = compareSchemaWithYml(introspectedColumns, ymlColumns, datasetInfo);

      expect(discrepancies).toHaveLength(2);
      expect(discrepancies[0].type).toBe('missing_column');
      expect(discrepancies[0].columnName).toBe('email');
      expect(discrepancies[0].severity).toBe('critical');
      expect(discrepancies[1].type).toBe('missing_column');
      expect(discrepancies[1].columnName).toBe('total');
    });

    it('should detect type mismatches', () => {
      const introspectedColumns: Column[] = [
        { name: 'id', dataType: 'VARCHAR(50)', nullable: false } as Column,
        { name: 'amount', dataType: 'VARCHAR(255)', nullable: true } as Column,
      ];

      const ymlColumns: YmlColumnInfo[] = [
        { name: 'id', type: 'number', source: 'dimension' }, // Type mismatch
        { name: 'amount', type: 'number', source: 'measure' }, // Type mismatch
      ];

      const discrepancies = compareSchemaWithYml(introspectedColumns, ymlColumns, datasetInfo);

      expect(discrepancies).toHaveLength(2);
      expect(discrepancies[0].type).toBe('type_mismatch');
      expect(discrepancies[0].severity).toBe('warning');
      expect(discrepancies[0].ymlValue).toBe('number');
      expect(discrepancies[0].databaseValue).toBe('string');
    });

    it('should handle case-insensitive column matching', () => {
      const introspectedColumns: Column[] = [
        { name: 'OrderID', dataType: 'INTEGER', nullable: false } as Column,
        { name: 'Customer_Name', dataType: 'VARCHAR(255)', nullable: true } as Column,
      ];

      const ymlColumns: YmlColumnInfo[] = [
        { name: 'orderid', type: 'number', source: 'dimension' },
        { name: 'customer_name', type: 'string', source: 'dimension' },
      ];

      const discrepancies = compareSchemaWithYml(introspectedColumns, ymlColumns, datasetInfo);

      expect(discrepancies).toHaveLength(0);
    });

    it('should recognize compatible type variations', () => {
      const introspectedColumns: Column[] = [
        { name: 'id', dataType: 'BIGINT', nullable: false } as Column,
        { name: 'name', dataType: 'TEXT', nullable: true } as Column,
        { name: 'created', dataType: 'TIMESTAMP', nullable: false } as Column,
        { name: 'active', dataType: 'BOOLEAN', nullable: false } as Column,
      ];

      const ymlColumns: YmlColumnInfo[] = [
        { name: 'id', type: 'number', source: 'dimension' },
        { name: 'name', type: 'string', source: 'dimension' },
        { name: 'created', type: 'timestamp', source: 'dimension' },
        { name: 'active', type: 'boolean', source: 'dimension' },
      ];

      const discrepancies = compareSchemaWithYml(introspectedColumns, ymlColumns, datasetInfo);

      expect(discrepancies).toHaveLength(0);
    });
  });

  describe('categorizeDiscrepancies', () => {
    it('should categorize by severity', () => {
      const discrepancies = [
        {
          type: 'missing_column' as const,
          severity: 'critical' as const,
          datasetId: '1',
          datasetName: 'test',
          tableName: 'table',
          columnName: 'col1',
          message: 'Missing column',
        },
        {
          type: 'type_mismatch' as const,
          severity: 'warning' as const,
          datasetId: '1',
          datasetName: 'test',
          tableName: 'table',
          columnName: 'col2',
          ymlValue: 'string',
          databaseValue: 'number',
          message: 'Type mismatch',
        },
        {
          type: 'missing_column' as const,
          severity: 'critical' as const,
          datasetId: '1',
          datasetName: 'test',
          tableName: 'table',
          columnName: 'col3',
          message: 'Another missing column',
        },
      ];

      const categorized = categorizeDiscrepancies(discrepancies);

      expect(categorized.critical).toHaveLength(2);
      expect(categorized.warning).toHaveLength(1);
      expect(categorized.info).toHaveLength(0);
      expect(categorized.byType.missing_column).toHaveLength(2);
      expect(categorized.byType.type_mismatch).toHaveLength(1);
    });
  });

  describe('dedupDiscrepancies', () => {
    it('should remove duplicate discrepancies', () => {
      const discrepancies = [
        {
          type: 'missing_column' as const,
          severity: 'critical' as const,
          datasetId: '1',
          datasetName: 'test',
          tableName: 'table',
          columnName: 'col1',
          message: 'Column col1 not found',
        },
        {
          type: 'missing_column' as const,
          severity: 'critical' as const,
          datasetId: '1',
          datasetName: 'test',
          tableName: 'table',
          columnName: 'col1',
          message: 'Column col1 not found', // Duplicate
        },
        {
          type: 'missing_column' as const,
          severity: 'critical' as const,
          datasetId: '1',
          datasetName: 'test',
          tableName: 'table',
          columnName: 'col2',
          message: 'Column col2 not found', // Different column
        },
      ];

      const deduped = dedupDiscrepancies(discrepancies);

      expect(deduped).toHaveLength(2);
      expect(deduped.map((d) => d.columnName)).toEqual(['col1', 'col2']);
    });
  });
});
