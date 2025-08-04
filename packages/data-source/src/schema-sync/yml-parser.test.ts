import { describe, expect, it } from 'vitest';
import { extractColumnsFromYml, normalizeColumnNames, parseDatasetYml } from './yml-parser';

describe('yml-parser', () => {
  describe('parseDatasetYml', () => {
    it('should parse valid dataset YML', () => {
      const ymlContent = `
name: shopify_sales
description: Sales data from Shopify
data_source_name: analytics
database: production
schema: sales
dimensions:
  - name: order_id
    type: string
    description: Order identifier
  - name: customer_id
    type: string
measures:
  - name: order_total
    type: number
    description: Total order amount
  - name: item_count
    type: number
`;

      const result = parseDatasetYml(ymlContent);

      expect(result.name).toBe('shopify_sales');
      expect(result.description).toBe('Sales data from Shopify');
      expect(result.data_source_name).toBe('analytics');
      expect(result.database).toBe('production');
      expect(result.schema).toBe('sales');
      expect(result.dimensions).toHaveLength(2);
      expect(result.measures).toHaveLength(2);
    });

    it('should handle YML without optional fields', () => {
      const ymlContent = `
name: minimal_dataset
data_source_name: source
database: db
schema: public
`;

      const result = parseDatasetYml(ymlContent);

      expect(result.name).toBe('minimal_dataset');
      expect(result.dimensions).toEqual([]);
      expect(result.measures).toEqual([]);
      expect(result.metrics).toEqual([]);
    });

    it('should throw error for invalid YML syntax', () => {
      const invalidYml = `
name: bad
  - invalid: structure
    database db
`;

      expect(() => parseDatasetYml(invalidYml)).toThrow('Invalid');
    });

    it('should throw error for missing required fields', () => {
      const incompleteYml = `
name: incomplete
description: Missing required fields
`;

      expect(() => parseDatasetYml(incompleteYml)).toThrow('Invalid dataset YML structure');
    });
  });

  describe('extractColumnsFromYml', () => {
    it('should extract columns from dimensions and measures', () => {
      const parsedYml = {
        name: 'test',
        data_source_name: 'source',
        database: 'db',
        schema: 'schema',
        dimensions: [
          { name: 'dim1', type: 'string' },
          { name: 'dim2', type: 'number' },
        ],
        measures: [
          { name: 'measure1', type: 'number' },
          { name: 'measure2', type: 'timestamp' },
        ],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const columns = extractColumnsFromYml(parsedYml);

      expect(columns).toHaveLength(4);
      expect(columns[0]).toEqual({ name: 'dim1', type: 'string', source: 'dimension' });
      expect(columns[1]).toEqual({ name: 'dim2', type: 'number', source: 'dimension' });
      expect(columns[2]).toEqual({ name: 'measure1', type: 'number', source: 'measure' });
      expect(columns[3]).toEqual({ name: 'measure2', type: 'timestamp', source: 'measure' });
    });

    it('should handle empty dimensions and measures', () => {
      const parsedYml = {
        name: 'test',
        data_source_name: 'source',
        database: 'db',
        schema: 'schema',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const columns = extractColumnsFromYml(parsedYml);

      expect(columns).toEqual([]);
    });
  });

  describe('normalizeColumnNames', () => {
    it('should normalize column names to lowercase', () => {
      const columns = [
        { name: 'OrderID', type: 'string', source: 'dimension' as const },
        { name: 'Customer_Name', type: 'string', source: 'dimension' as const },
        { name: 'TOTAL_AMOUNT', type: 'number', source: 'measure' as const },
      ];

      const normalized = normalizeColumnNames(columns);

      expect(normalized[0].name).toBe('orderid');
      expect(normalized[1].name).toBe('customer_name');
      expect(normalized[2].name).toBe('total_amount');
    });

    it('should trim whitespace from column names', () => {
      const columns = [
        { name: '  order_id  ', type: 'string', source: 'dimension' as const },
        { name: 'customer_name\t', type: 'string', source: 'dimension' as const },
      ];

      const normalized = normalizeColumnNames(columns);

      expect(normalized[0].name).toBe('order_id');
      expect(normalized[1].name).toBe('customer_name');
    });
  });
});
