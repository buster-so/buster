import { describe, expect, it } from 'vitest';
import type { DbtFile } from './dbt-schemas';
import {
  getDbtFileStatistics,
  transformDbtFileToBusterModels,
  validateDbtFileForTransformation,
} from './dbt-to-buster-transformer';

describe('dbt-to-buster-transformer', () => {
  describe('transformDbtFileToBusterModels', () => {
    it('should transform dbt file with traditional model', () => {
      const dbtFile: DbtFile = {
        version: 2,
        models: [
          {
            name: 'users',
            description: 'User table',
            columns: [
              { name: 'user_id', description: 'User ID' },
              { name: 'email', description: 'Email address' },
              { name: 'created_at', description: 'Creation date' },
            ],
          },
        ],
        semantic_models: [],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      expect(busterModels[0]?.name).toBe('users');
      expect(busterModels[0]?.description).toBe('User table');
      expect(busterModels[0]?.dimensions.length).toBeGreaterThan(0);
    });

    it('should transform dbt file with semantic model', () => {
      const dbtFile: DbtFile = {
        version: 2,
        models: [
          {
            name: 'orders',
            columns: [
              { name: 'order_id' },
              { name: 'customer_id' },
              { name: 'order_total', description: 'Total amount' },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'orders_semantic',
            model: "ref('orders')",
            entities: [{ name: 'order', type: 'primary', expr: 'order_id' }],
            dimensions: [
              {
                name: 'order_date',
                type: 'time',
                expr: 'created_at',
              },
            ],
            measures: [
              {
                name: 'total_revenue',
                agg: 'sum',
                expr: 'order_total',
              },
            ],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      expect(busterModels[0]?.name).toBe('orders');
      expect(busterModels[0]?.metrics.length).toBeGreaterThan(0);
      expect(busterModels[0]?.filters.length).toBeGreaterThan(0);
      expect(busterModels[0]?.metrics[0]?.name).toBe('total_revenue');
    });

    it('should process semantic model and traditional model only once', () => {
      const dbtFile: DbtFile = {
        version: 2,
        models: [
          {
            name: 'products',
            columns: [{ name: 'product_id' }, { name: 'product_name' }],
          },
        ],
        semantic_models: [
          {
            name: 'products_semantic',
            model: "ref('products')",
            entities: [{ name: 'product', type: 'primary', expr: 'product_id' }],
            dimensions: [],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      // Should only create ONE model (not two), even though both traditional and semantic exist
      expect(busterModels).toHaveLength(1);
      expect(busterModels[0]?.name).toBe('products');
    });

    it('should handle multiple models', () => {
      const dbtFile: DbtFile = {
        version: 2,
        models: [
          {
            name: 'users',
            columns: [{ name: 'user_id' }],
          },
          {
            name: 'orders',
            columns: [{ name: 'order_id' }],
          },
          {
            name: 'products',
            columns: [{ name: 'product_id' }],
          },
        ],
        semantic_models: [],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(3);
      expect(busterModels.map((m) => m.name)).toContain('users');
      expect(busterModels.map((m) => m.name)).toContain('orders');
      expect(busterModels.map((m) => m.name)).toContain('products');
    });

    it('should merge columns, measures, dimensions, and relationships', () => {
      const dbtFile: DbtFile = {
        version: 2,
        models: [
          {
            name: 'transactions',
            columns: [
              { name: 'transaction_id' },
              { name: 'amount', description: 'Transaction amount' },
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
          },
        ],
        semantic_models: [
          {
            name: 'transactions_semantic',
            model: "ref('transactions')",
            entities: [{ name: 'transaction', type: 'primary', expr: 'transaction_id' }],
            dimensions: [{ name: 'created_at', type: 'time' }],
            measures: [{ name: 'total_amount', agg: 'sum', expr: 'amount' }],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have dimensions from columns
      expect(model?.dimensions.length).toBeGreaterThan(0);

      // Should have measures from columns
      expect(model?.measures.length).toBeGreaterThan(0);

      // Should have metrics from semantic measures
      expect(model?.metrics).toHaveLength(1);
      expect(model?.metrics[0]?.name).toBe('total_amount');

      // Should have filters from semantic dimensions
      expect(model?.filters.length).toBeGreaterThan(0);

      // Should have relationships from tests
      expect(model?.relationships.length).toBeGreaterThan(0);
    });

    it('should handle empty dbt file', () => {
      const dbtFile: DbtFile = {
        models: [],
        semantic_models: [],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(0);
    });
  });

  describe('validateDbtFileForTransformation', () => {
    it('should validate file with models', () => {
      const dbtFile: DbtFile = {
        models: [{ name: 'users', columns: [] }],
        semantic_models: [],
      };

      const validation = validateDbtFileForTransformation(dbtFile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate file with semantic models', () => {
      const dbtFile: DbtFile = {
        models: [],
        semantic_models: [
          {
            name: 'orders_semantic',
            model: "ref('orders')",
            entities: [],
            dimensions: [],
            measures: [],
          },
        ],
      };

      const validation = validateDbtFileForTransformation(dbtFile);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should error on completely empty file', () => {
      const dbtFile: DbtFile = {
        models: [],
        semantic_models: [],
      };

      const validation = validateDbtFileForTransformation(dbtFile);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain('at least one model');
    });

    it('should warn when semantic model references missing traditional model', () => {
      const dbtFile: DbtFile = {
        models: [],
        semantic_models: [
          {
            name: 'users_semantic',
            model: "ref('users')", // References 'users' but it's not in models array
            entities: [],
            dimensions: [],
            measures: [],
          },
        ],
      };

      const validation = validateDbtFileForTransformation(dbtFile);

      expect(validation.valid).toBe(true); // Still valid, but with warnings
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('not defined in the models array');
    });

    it('should warn when measures exist without agg_time_dimension', () => {
      const dbtFile: DbtFile = {
        models: [{ name: 'orders', columns: [] }],
        semantic_models: [
          {
            name: 'orders_semantic',
            model: "ref('orders')",
            entities: [],
            dimensions: [],
            measures: [{ name: 'total_revenue', agg: 'sum', expr: 'revenue' }],
            // Missing defaults.agg_time_dimension
          },
        ],
      };

      const validation = validateDbtFileForTransformation(dbtFile);

      expect(validation.valid).toBe(true);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.warnings[0]).toContain('agg_time_dimension');
    });
  });

  describe('getDbtFileStatistics', () => {
    it('should count models and semantic models', () => {
      const dbtFile: DbtFile = {
        models: [
          { name: 'users', columns: [] },
          { name: 'orders', columns: [] },
        ],
        semantic_models: [
          {
            name: 'orders_semantic',
            model: "ref('orders')",
            entities: [],
            dimensions: [],
            measures: [],
          },
        ],
      };

      const stats = getDbtFileStatistics(dbtFile);

      expect(stats.modelCount).toBe(2);
      expect(stats.semanticModelCount).toBe(1);
    });

    it('should count columns, entities, dimensions, and measures', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'users',
            columns: [{ name: 'id' }, { name: 'email' }, { name: 'name' }],
          },
        ],
        semantic_models: [
          {
            name: 'users_semantic',
            model: "ref('users')",
            entities: [{ name: 'user', type: 'primary', expr: 'id' }],
            dimensions: [{ name: 'created_at', type: 'time' }],
            measures: [
              { name: 'user_count', agg: 'count' },
              { name: 'total_value', agg: 'sum', expr: 'value' },
            ],
          },
        ],
      };

      const stats = getDbtFileStatistics(dbtFile);

      expect(stats.totalColumns).toBe(3);
      expect(stats.totalEntities).toBe(1);
      expect(stats.totalDimensions).toBe(1);
      expect(stats.totalMeasures).toBe(2);
    });

    it('should handle empty file', () => {
      const dbtFile: DbtFile = {
        models: [],
        semantic_models: [],
      };

      const stats = getDbtFileStatistics(dbtFile);

      expect(stats.modelCount).toBe(0);
      expect(stats.semanticModelCount).toBe(0);
      expect(stats.totalColumns).toBe(0);
      expect(stats.totalEntities).toBe(0);
      expect(stats.totalDimensions).toBe(0);
      expect(stats.totalMeasures).toBe(0);
    });
  });

  // Custom Buster Extension Tests
  describe('custom buster extensions', () => {
    it('should prioritize model-level relationships over test relationships', () => {
      const dbtFile: DbtFile = {
        models: [
          {
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
            // Custom Buster extension - model-level relationships (highest priority)
            relationships: [
              {
                name: 'customer_relationship',
                source_col: 'customer_id',
                ref_col: 'customers.id',
                type: 'many_to_one',
                cardinality: 'required',
              },
            ],
          },
        ],
        semantic_models: [],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Model-level relationship should be present (comes first due to precedence)
      const modelRel = model?.relationships.find((r) => r.name === 'customer_relationship');
      expect(modelRel).toBeDefined();
      expect(modelRel?.ref_col).toBe('customers.id');
      expect(modelRel?.cardinality).toBe('required');

      // Test relationship is also merged (deduplication happens based on source+ref, but these have different ref_col)
      // customer_id → customers.customer_id (test) vs customer_id → customers.id (model-level)
    });

    it('should merge model-level, entity, and test relationships with correct precedence', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'order_items',
            columns: [
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
            // Custom Buster extension - model-level relationships
            relationships: [
              {
                name: 'order_rel',
                source_col: 'order_id',
                ref_col: 'orders.id',
                type: 'many_to_one',
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'order_items_semantic',
            model: "ref('order_items')",
            entities: [
              { name: 'order_item', type: 'primary', expr: 'id' },
              { name: 'order', type: 'foreign', expr: 'order_id' },
            ],
            dimensions: [],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have relationships from all three sources merged
      // 1. Model-level: order_rel
      // 2. Entity: order (foreign entity)
      // 3. Test: product_id relationship
      expect(model?.relationships.length).toBeGreaterThanOrEqual(2);

      // Model-level relationship should be present
      expect(model?.relationships.some((r) => r.name === 'order_rel')).toBe(true);

      // Test relationship should be present
      expect(model?.relationships.some((r) => r.ref_col.includes('products'))).toBe(true);
    });

    it('should use model-level relationships for traditional models without semantic layer', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'products',
            columns: [{ name: 'product_id' }, { name: 'category_id' }],
            // Custom Buster extension - model-level relationships
            relationships: [
              {
                name: 'category_rel',
                source_col: 'category_id',
                ref_col: 'categories.id',
                type: 'many_to_one',
                description: 'Product belongs to category',
              },
            ],
          },
        ],
        semantic_models: [],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      expect(model?.relationships).toHaveLength(1);
      expect(model?.relationships[0]?.name).toBe('category_rel');
      expect(model?.relationships[0]?.description).toBe('Product belongs to category');
    });

    it('should handle model with no relationships gracefully', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'standalone',
            columns: [{ name: 'id' }],
            // No relationships field
          },
        ],
        semantic_models: [],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      expect(busterModels[0]?.relationships).toHaveLength(0);
    });
  });

  // Dimension Deduplication Tests
  describe('dimension deduplication', () => {
    it('should deduplicate dimensions when semantic dimension references column', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'name',
                description: 'Human-readable product name with details',
                searchable: true,
              },
              {
                name: 'color',
                description: 'Product color attribute',
                searchable: true,
                options: ['Black', 'Silver', 'Red', 'Blue'],
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [{ name: 'product', type: 'primary', expr: 'productID' }],
            dimensions: [
              { name: 'name', type: 'categorical', description: 'Product name' },
              { name: 'color', type: 'categorical' },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have only 2 dimensions (deduplicated), not 4
      expect(model?.dimensions).toHaveLength(2);

      // Check name dimension - should have column metadata + semantic type
      const nameDim = model?.dimensions.find((d) => d.name === 'name');
      expect(nameDim).toBeDefined();
      expect(nameDim?.description).toBe('Human-readable product name with details'); // Column wins
      expect(nameDim?.searchable).toBe(true); // Column only
      expect(nameDim?.type).toBe('string'); // Semantic wins (categorical normalized to string)

      // Check color dimension - should have options from column + type from semantic
      const colorDim = model?.dimensions.find((d) => d.name === 'color');
      expect(colorDim).toBeDefined();
      expect(colorDim?.options).toEqual(['Black', 'Silver', 'Red', 'Blue']); // Column only
      expect(colorDim?.searchable).toBe(true); // Column only
      expect(colorDim?.type).toBe('string'); // Semantic wins (categorical normalized to string)
    });

    it('should keep complex semantic dimensions separate', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'sellEndDate',
                description: 'Date when product was discontinued',
                data_type: 'timestamp',
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [],
            dimensions: [
              {
                name: 'is_active',
                type: 'categorical',
                expr: 'CASE WHEN sellEndDate IS NULL THEN true ELSE false END',
                description: 'Whether product is currently active',
              },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have 2 dimensions: sellEndDate and is_active (not merged due to complex expr)
      expect(model?.dimensions).toHaveLength(2);

      // Check sellEndDate exists
      const sellEndDate = model?.dimensions.find((d) => d.name === 'sellEndDate');
      expect(sellEndDate).toBeDefined();
      expect(sellEndDate?.description).toBe('Date when product was discontinued');

      // Check is_active exists as separate dimension
      const isActive = model?.dimensions.find((d) => d.name === 'is_active');
      expect(isActive).toBeDefined();
      expect(isActive?.description).toBe('Whether product is currently active');
      expect(isActive?.type).toBe('string'); // categorical normalized to string
    });

    it('should merge time dimensions with granularity', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'orders',
            columns: [
              {
                name: 'created_at',
                description: 'Order creation timestamp',
                data_type: 'timestamp',
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'orders_semantic',
            model: "ref('orders')",
            entities: [],
            dimensions: [
              {
                name: 'created_at',
                type: 'time',
                type_params: { time_granularity: 'day' },
              },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have only 1 dimension (merged)
      expect(model?.dimensions).toHaveLength(1);

      const createdAt = model?.dimensions[0];
      expect(createdAt?.name).toBe('created_at');
      expect(createdAt?.description).toBe('Order creation timestamp'); // Column description
      expect(createdAt?.type).toBe('time'); // Semantic type
      expect((createdAt as any).time_granularity).toBe('day'); // Semantic granularity
    });

    it('should add unmatched semantic dimensions', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [{ name: 'productID', searchable: true }],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [],
            dimensions: [
              { name: 'productID', type: 'categorical' },
              { name: 'category', type: 'categorical', description: 'Product category' },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have 2 dimensions: productID (merged) and category (unmatched, added)
      expect(model?.dimensions).toHaveLength(2);

      const productID = model?.dimensions.find((d) => d.name === 'productID');
      expect(productID?.searchable).toBe(true); // From column

      const category = model?.dimensions.find((d) => d.name === 'category');
      expect(category).toBeDefined();
      expect(category?.description).toBe('Product category');
    });

    it('should handle real-world product example with many dimensions', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'name',
                description: 'Human-readable product name with descriptive attributes',
                searchable: true,
              },
              {
                name: 'color',
                description: 'Product color attribute',
                searchable: true,
                options: ['Black', 'Silver', 'Red', 'Blue', 'Green'],
              },
              {
                name: 'sellStartDate',
                description: 'Date when product became available',
                data_type: 'timestamp',
              },
              {
                name: 'sellEndDate',
                description: 'Date when product was discontinued',
                data_type: 'timestamp',
              },
              {
                name: 'productLine',
                description: 'Product line classification',
                options: ['R', 'M', 'T', 'S'],
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [],
            dimensions: [
              {
                name: 'sellStartDate',
                type: 'time',
                type_params: { time_granularity: 'day' },
              },
              { name: 'name', type: 'categorical' },
              { name: 'color', type: 'categorical' },
              { name: 'productLine', type: 'categorical' },
              {
                name: 'is_active',
                type: 'categorical',
                expr: 'CASE WHEN sellEndDate IS NULL THEN true ELSE false END',
                description: 'Whether product is currently active',
              },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);

      expect(busterModels).toHaveLength(1);
      const model = busterModels[0];

      // Should have 6 dimensions total:
      // - name (merged)
      // - color (merged)
      // - sellStartDate (merged with granularity)
      // - sellEndDate (column only, not in semantic)
      // - productLine (merged)
      // - is_active (semantic only, complex expr)
      expect(model?.dimensions).toHaveLength(6);

      // Verify merged dimensions preserve column metadata
      const name = model?.dimensions.find((d) => d.name === 'name');
      expect(name?.searchable).toBe(true);
      expect(name?.description).toBe('Human-readable product name with descriptive attributes');
      expect(name?.type).toBe('string'); // Semantic wins (categorical normalized to string)

      const color = model?.dimensions.find((d) => d.name === 'color');
      expect(color?.options).toEqual(['Black', 'Silver', 'Red', 'Blue', 'Green']);
      expect(color?.type).toBe('string'); // Semantic wins (categorical normalized to string)

      const sellStartDate = model?.dimensions.find((d) => d.name === 'sellStartDate');
      expect(sellStartDate?.type).toBe('time');
      expect((sellStartDate as any).time_granularity).toBe('day');
      expect(sellStartDate?.description).toBe('Date when product became available');

      // Verify unmatched column dimension exists
      const sellEndDate = model?.dimensions.find((d) => d.name === 'sellEndDate');
      expect(sellEndDate).toBeDefined();

      // Verify complex semantic dimension exists separately
      const isActive = model?.dimensions.find((d) => d.name === 'is_active');
      expect(isActive).toBeDefined();
      expect(isActive?.description).toBe('Whether product is currently active');
    });

    it('should preserve column options when merging with semantic dimensions (meta.options)', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color attribute for bikes, frames, and certain accessories.',
                config: {
                  meta: {
                    options: [
                      'Black',
                      'Silver',
                      'Red',
                      'Blue',
                      'Green',
                      'Yellow',
                      'Purple',
                      'Orange',
                      'Brown',
                    ],
                    searchable: true,
                  },
                },
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [],
            dimensions: [
              {
                name: 'color',
                type: 'categorical',
                description:
                  'Product color attribute; 49% null (components without color, by design).',
              },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);
      const model = busterModels[0];

      // Should have 1 dimension (color merged)
      expect(model?.dimensions).toHaveLength(1);

      const colorDim = model?.dimensions[0];
      expect(colorDim?.name).toBe('color');

      // Should preserve options from column meta
      expect(colorDim?.options).toBeDefined();
      expect(colorDim?.options).toEqual([
        'Black',
        'Silver',
        'Red',
        'Blue',
        'Green',
        'Yellow',
        'Purple',
        'Orange',
        'Brown',
      ]);

      // Should preserve searchable from column meta
      expect(colorDim?.searchable).toBe(true);

      // Should use type from semantic dimension (categorical normalized to string)
      expect(colorDim?.type).toBe('string');

      // Should use description from column (more detailed)
      expect(colorDim?.description).toBe(
        'Product color attribute for bikes, frames, and certain accessories.'
      );

      // Should NOT appear as a measure
      expect(model?.measures).toHaveLength(0);
    });

    it('should preserve column options when merging with semantic dimensions (top-level options)', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color attribute',
                // Top-level options field (Custom Buster extension)
                options: [
                  'Black',
                  'Silver',
                  'Red',
                  'Blue',
                  'Green',
                  'Yellow',
                  'Purple',
                  'Orange',
                  'Brown',
                ],
                searchable: true,
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [],
            dimensions: [
              {
                name: 'color',
                type: 'categorical',
                description: 'Product color from semantic',
              },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);
      const model = busterModels[0];

      // Should have 1 dimension (color merged)
      expect(model?.dimensions).toHaveLength(1);

      const colorDim = model?.dimensions[0];
      expect(colorDim?.name).toBe('color');

      // Should preserve options from top-level column field
      expect(colorDim?.options).toBeDefined();
      expect(colorDim?.options).toEqual([
        'Black',
        'Silver',
        'Red',
        'Blue',
        'Green',
        'Yellow',
        'Purple',
        'Orange',
        'Brown',
      ]);

      // Should preserve searchable from top-level column field
      expect(colorDim?.searchable).toBe(true);

      // Should use type from semantic dimension (categorical normalized to string)
      expect(colorDim?.type).toBe('string');

      // Should use description from column (precedence)
      expect(colorDim?.description).toBe('Product color attribute');

      // Should NOT appear as a measure
      expect(model?.measures).toHaveLength(0);
    });

    it('should NOT create measures for columns defined as semantic dimensions', () => {
      const dbtFile: DbtFile = {
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color',
                config: { meta: { options: ['Black', 'Silver', 'Red'], searchable: true } },
              },
              {
                name: 'makeFlag',
                description: 'Boolean make flag',
                data_type: 'boolean',
              },
              {
                name: 'listPrice',
                description: 'List price in USD',
                data_type: 'decimal',
              },
              {
                name: 'standardCost',
                description: 'Standard cost in USD',
                data_type: 'decimal',
              },
            ],
          },
        ],
        semantic_models: [
          {
            name: 'product_semantic',
            model: "ref('product')",
            entities: [],
            dimensions: [
              { name: 'color', type: 'categorical' },
              { name: 'makeFlag', type: 'categorical' },
            ],
            measures: [],
          },
        ],
      };

      const busterModels = transformDbtFileToBusterModels(dbtFile);
      const model = busterModels[0];

      // Should have 2 dimensions (color and makeFlag from semantic model)
      expect(model?.dimensions).toHaveLength(2);
      expect(model?.dimensions.map((d) => d.name)).toContain('color');
      expect(model?.dimensions.map((d) => d.name)).toContain('makeFlag');

      // Should have 2 measures (listPrice and standardCost - NOT in semantic dimensions)
      expect(model?.measures).toHaveLength(2);
      expect(model?.measures.map((m) => m.name)).toContain('listPrice');
      expect(model?.measures.map((m) => m.name)).toContain('standardCost');

      // color and makeFlag should NOT appear as measures
      expect(model?.measures.map((m) => m.name)).not.toContain('color');
      expect(model?.measures.map((m) => m.name)).not.toContain('makeFlag');
    });
  });
});
