import { describe, expect, it } from 'vitest';
import type { DbtColumn, DbtDimension, DbtEntity, DbtMeasure, DbtModel } from '../dbt-schemas';
import { transformColumnsToDimensionsAndMeasures } from './column-transformer';
import { transformDimensionToFilters } from './dimension-filter-transformer';
import { extractModelNameFromRef, findModelByEntityName, findPrimaryKey } from './entity-resolver';
import { transformMeasuresToMetrics, transformMeasureToMetric } from './measure-transformer';
import { extractRelationshipsFromModel, mergeRelationships } from './relationship-parser';

describe('transformers', () => {
  describe('column-transformer', () => {
    it('should transform numeric columns to measures', () => {
      const columns: DbtColumn[] = [
        { name: 'total_revenue', description: 'Total revenue amount' },
        { name: 'order_count', description: 'Number of orders' },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.measures).toHaveLength(2);
      expect(result.measures[0]?.name).toBe('total_revenue');
      expect(result.measures[1]?.name).toBe('order_count');
      expect(result.dimensions).toHaveLength(0);
    });

    it('should transform non-numeric columns to dimensions', () => {
      const columns: DbtColumn[] = [
        { name: 'customer_name', description: 'Customer name' },
        { name: 'order_status', description: 'Order status' },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions).toHaveLength(2);
      expect(result.dimensions[0]?.name).toBe('customer_name');
      expect(result.dimensions[1]?.name).toBe('order_status');
      expect(result.measures).toHaveLength(0);
    });

    it('should extract searchable meta field', () => {
      const columns: DbtColumn[] = [
        {
          name: 'email',
          config: { meta: { searchable: true } },
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.searchable).toBe(true);
    });

    it('should extract options meta field', () => {
      const columns: DbtColumn[] = [
        {
          name: 'status',
          config: { meta: { options: ['active', 'inactive', 'pending'] } },
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.options).toEqual(['active', 'inactive', 'pending']);
    });

    // Custom Buster Extension Tests
    it('should prioritize top-level searchable over meta field', () => {
      const columns: DbtColumn[] = [
        {
          name: 'email',
          searchable: true, // Top-level custom Buster field
          config: { meta: { searchable: false } }, // Meta field (should be ignored)
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.searchable).toBe(true);
    });

    it('should use meta searchable when top-level is not present', () => {
      const columns: DbtColumn[] = [
        {
          name: 'email',
          config: { meta: { searchable: true } },
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.searchable).toBe(true);
    });

    it('should prioritize top-level options over meta field', () => {
      const columns: DbtColumn[] = [
        {
          name: 'status',
          options: ['new', 'processing', 'completed'], // Top-level custom Buster field
          config: { meta: { options: ['active', 'inactive'] } }, // Meta field (should be ignored)
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.options).toEqual(['new', 'processing', 'completed']);
    });

    it('should use meta options when top-level is not present', () => {
      const columns: DbtColumn[] = [
        {
          name: 'status',
          config: { meta: { options: ['active', 'inactive'] } },
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.options).toEqual(['active', 'inactive']);
    });

    it('should support numeric and boolean options at top level', () => {
      const columns: DbtColumn[] = [
        {
          name: 'status_code',
          options: [1, 2, 3, true, false], // Mixed types
        },
      ];

      const result = transformColumnsToDimensionsAndMeasures(columns);

      expect(result.dimensions[0]?.options).toEqual([1, 2, 3, true, false]);
    });
  });

  describe('measure-transformer', () => {
    it('should transform sum measure to metric', () => {
      const measure: DbtMeasure = {
        name: 'total_revenue',
        description: 'Sum of revenue',
        agg: 'sum',
        expr: 'revenue',
      };

      const metric = transformMeasureToMetric(measure);

      expect(metric.name).toBe('total_revenue');
      expect(metric.expr).toBe('sum(revenue)');
      expect(metric.description).toBe('Sum of revenue');
    });

    it('should transform count measure to metric', () => {
      const measure: DbtMeasure = {
        name: 'order_count',
        agg: 'count',
      };

      const metric = transformMeasureToMetric(measure);

      expect(metric.expr).toBe('count(*)');
    });

    it('should transform count_distinct measure to metric', () => {
      const measure: DbtMeasure = {
        name: 'unique_customers',
        agg: 'count_distinct',
        expr: 'customer_id',
      };

      const metric = transformMeasureToMetric(measure);

      expect(metric.expr).toBe('count(distinct customer_id)');
    });

    it('should transform average measure to metric', () => {
      const measure: DbtMeasure = {
        name: 'avg_order_value',
        agg: 'average',
        expr: 'order_total',
      };

      const metric = transformMeasureToMetric(measure);

      expect(metric.expr).toBe('average(order_total)');
    });

    it('should transform array of measures to metrics', () => {
      const measures: DbtMeasure[] = [
        { name: 'total_sales', agg: 'sum', expr: 'amount' },
        { name: 'order_count', agg: 'count' },
      ];

      const metrics = transformMeasuresToMetrics(measures);

      expect(metrics).toHaveLength(2);
      expect(metrics[0]?.name).toBe('total_sales');
      expect(metrics[0]?.expr).toBe('sum(amount)');
      expect(metrics[1]?.name).toBe('order_count');
      expect(metrics[1]?.expr).toBe('count(*)');
    });
  });

  describe('dimension-filter-transformer', () => {
    it('should generate time filters for time dimensions', () => {
      const dimension: DbtDimension = {
        name: 'created_at',
        type: 'time',
        description: 'Creation timestamp',
      };

      const filters = transformDimensionToFilters(dimension);

      expect(filters.length).toBeGreaterThan(0);
      expect(filters.some((f) => f.name.includes('last_7_days'))).toBe(true);
      expect(filters.some((f) => f.name.includes('last_30_days'))).toBe(true);
      expect(filters.some((f) => f.expr.includes('INTERVAL'))).toBe(true);
    });

    it('should generate categorical filters for categorical dimensions', () => {
      const dimension: DbtDimension = {
        name: 'status',
        type: 'categorical',
        description: 'Order status',
      };

      const filters = transformDimensionToFilters(dimension);

      expect(filters.length).toBeGreaterThan(0);
      expect(filters[0]?.name).toContain('status');
    });

    it('should default to categorical if type not specified', () => {
      const dimension: DbtDimension = {
        name: 'category',
      };

      const filters = transformDimensionToFilters(dimension);

      expect(filters.length).toBeGreaterThan(0);
    });
  });

  describe('entity-resolver', () => {
    describe('extractModelNameFromRef', () => {
      it('should extract model name from ref with single quotes', () => {
        expect(extractModelNameFromRef("ref('users')")).toBe('users');
      });

      it('should extract model name from ref with double quotes', () => {
        expect(extractModelNameFromRef('ref("orders")')).toBe('orders');
      });

      it('should extract model name from ref with Jinja templating', () => {
        expect(extractModelNameFromRef("{{ ref('customers') }}")).toBe('customers');
      });

      it('should handle whitespace', () => {
        expect(extractModelNameFromRef("  ref( 'products' )  ")).toBe('products');
      });

      it('should return original string if no ref found', () => {
        expect(extractModelNameFromRef('plain_string')).toBe('plain_string');
      });
    });

    describe('findModelByEntityName', () => {
      const models: DbtModel[] = [
        { name: 'users', columns: [] },
        { name: 'customers', columns: [] },
        { name: 'dim_products', columns: [] },
      ];

      it('should find model by exact name match', () => {
        const model = findModelByEntityName('users', models, []);
        expect(model?.name).toBe('users');
      });

      it('should find model by pluralization', () => {
        const model = findModelByEntityName('customer', models, []);
        expect(model?.name).toBe('customers');
      });

      it('should find model with common prefix', () => {
        const model = findModelByEntityName('product', models, []);
        expect(model?.name).toBe('dim_products');
      });

      it('should return null for unknown entity', () => {
        const model = findModelByEntityName('unknown_entity', models, []);
        expect(model).toBeNull();
      });
    });

    describe('findPrimaryKey', () => {
      it('should find primary key from unique + not_null tests', () => {
        const model: DbtModel = {
          name: 'users',
          columns: [
            {
              name: 'user_id',
              data_tests: ['unique', 'not_null'],
            },
            {
              name: 'email',
              data_tests: ['unique'],
            },
          ],
        };

        expect(findPrimaryKey(model, [])).toBe('user_id');
      });

      it('should fallback to common naming patterns', () => {
        const model: DbtModel = {
          name: 'orders',
          columns: [{ name: 'id' }, { name: 'order_id' }, { name: 'customer_id' }],
        };

        // The implementation checks 'id' first, then '{model}_id'
        expect(findPrimaryKey(model, [])).toBe('id');
      });

      it('should default to "id" if no pattern matches', () => {
        const model: DbtModel = {
          name: 'mystery',
          columns: [{ name: 'field1' }, { name: 'field2' }],
        };

        expect(findPrimaryKey(model, [])).toBe('id');
      });
    });
  });

  describe('relationship-parser', () => {
    it('should extract relationships from column tests', () => {
      const model: DbtModel = {
        name: 'orders',
        columns: [
          {
            name: 'customer_id',
            data_tests: [
              {
                relationships: {
                  to: "ref('customers')",
                  field: 'customer_id',
                },
              },
            ],
          },
        ],
      };

      const relationships = extractRelationshipsFromModel(model);

      expect(relationships).toHaveLength(1);
      expect(relationships[0]?.name).toBe('customers_rel');
      expect(relationships[0]?.source_col).toBe('customer_id');
      expect(relationships[0]?.ref_col).toBe('customers.customer_id');
      expect(relationships[0]?.type).toBe('many_to_one');
    });

    it('should handle multiple relationships', () => {
      const model: DbtModel = {
        name: 'order_items',
        columns: [
          {
            name: 'order_id',
            data_tests: [
              {
                relationships: {
                  to: "ref('orders')",
                  field: 'order_id',
                },
              },
            ],
          },
          {
            name: 'product_id',
            data_tests: [
              {
                relationships: {
                  to: "ref('products')",
                  field: 'product_id',
                },
              },
            ],
          },
        ],
      };

      const relationships = extractRelationshipsFromModel(model);

      expect(relationships).toHaveLength(2);
    });

    it('should merge relationships and remove duplicates', () => {
      const relationships1 = [
        {
          name: 'users_rel',
          source_col: 'user_id',
          ref_col: 'users.id',
          type: 'many_to_one',
        },
      ];

      const relationships2 = [
        {
          name: 'users_rel_duplicate',
          source_col: 'user_id',
          ref_col: 'users.id', // Same source and ref
          type: 'many_to_one',
        },
        {
          name: 'products_rel',
          source_col: 'product_id',
          ref_col: 'products.id',
          type: 'many_to_one',
        },
      ];

      const merged = mergeRelationships(relationships1, relationships2);

      // Should have 2 unique relationships (duplicate removed)
      expect(merged).toHaveLength(2);
      expect(merged.some((r) => r.ref_col === 'users.id')).toBe(true);
      expect(merged.some((r) => r.ref_col === 'products.id')).toBe(true);
    });
  });
});
