import { describe, expect, it } from 'vitest';
import { DbtColumnSchema, DbtFileSchema, parseDbtFile } from './dbt-schemas';

describe('dbt-schemas', () => {
  describe('DbtColumnSchema - options field', () => {
    it('should accept primitive string options', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        options: ['Black', 'Silver', 'Red', 'Blue'],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual(['Black', 'Silver', 'Red', 'Blue']);
      }
    });

    it('should accept primitive number options', () => {
      const column = {
        name: 'size',
        description: 'Product size',
        options: [1, 2, 3, 4, 5],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it('should accept primitive boolean options', () => {
      const column = {
        name: 'is_active',
        description: 'Active status',
        options: [true, false],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([true, false]);
      }
    });

    it('should accept {{TODO}} marker', () => {
      const column = {
        name: 'status',
        description: 'Status field',
        options: ['{{TODO}}'],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual(['{{TODO}}']);
      }
    });

    it('should accept object format with value and description', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        options: [
          { value: 'Black', description: 'Matte black finish' },
          { value: 'Silver', description: 'Metallic silver' },
          { value: 'Red', description: 'Bright red' },
        ],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([
          { value: 'Black', description: 'Matte black finish' },
          { value: 'Silver', description: 'Metallic silver' },
          { value: 'Red', description: 'Bright red' },
        ]);
      }
    });

    it('should accept object format with numeric values', () => {
      const column = {
        name: 'size',
        description: 'Product size',
        options: [
          { value: 1, description: 'Small' },
          { value: 2, description: 'Medium' },
          { value: 3, description: 'Large' },
        ],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([
          { value: 1, description: 'Small' },
          { value: 2, description: 'Medium' },
          { value: 3, description: 'Large' },
        ]);
      }
    });

    it('should accept object format with boolean values', () => {
      const column = {
        name: 'is_active',
        description: 'Active status',
        options: [
          { value: true, description: 'Currently active' },
          { value: false, description: 'Inactive or discontinued' },
        ],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([
          { value: true, description: 'Currently active' },
          { value: false, description: 'Inactive or discontinued' },
        ]);
      }
    });

    it('should accept object format without description (optional)', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        options: [
          { value: 'Black' },
          { value: 'Silver', description: 'Metallic silver' },
          { value: 'Red' },
        ],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([
          { value: 'Black' },
          { value: 'Silver', description: 'Metallic silver' },
          { value: 'Red' },
        ]);
      }
    });

    it('should accept mixed format (primitives and objects)', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        options: [
          'Black',
          { value: 'Silver', description: 'Metallic silver' },
          'Red',
          { value: 'Blue', description: 'Deep blue' },
        ],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([
          'Black',
          { value: 'Silver', description: 'Metallic silver' },
          'Red',
          { value: 'Blue', description: 'Deep blue' },
        ]);
      }
    });

    it('should accept object with {{TODO}} as value', () => {
      const column = {
        name: 'status',
        description: 'Status field',
        options: [
          { value: '{{TODO}}', description: 'To be defined' },
          { value: 'active', description: 'Currently active' },
        ],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.options).toEqual([
          { value: '{{TODO}}', description: 'To be defined' },
          { value: 'active', description: 'Currently active' },
        ]);
      }
    });

    it('should reject invalid object format (missing value field)', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        options: [{ description: 'Matte black finish' }],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(false);
    });

    it('should reject invalid primitive types in options', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        options: [null, undefined],
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(false);
    });
  });

  describe('parseDbtFile - regression test for options parsing', () => {
    it('should parse dbt yml with primitive string options (original issue)', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color',
                options: ['Black', 'Silver', 'Red', 'Blue'],
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);
      expect(result.data?.models[0]?.columns[0]?.options).toEqual([
        'Black',
        'Silver',
        'Red',
        'Blue',
      ]);
    });

    it('should parse dbt yml with object format options with descriptions (new capability)', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color',
                options: [
                  { value: 'Black', description: 'Matte black finish' },
                  { value: 'Silver', description: 'Metallic silver' },
                ],
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);
      expect(result.data?.models[0]?.columns[0]?.options).toEqual([
        { value: 'Black', description: 'Matte black finish' },
        { value: 'Silver', description: 'Metallic silver' },
      ]);
    });

    it('should parse dbt yml with mixed primitive and object options', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color',
                options: ['Black', { value: 'Silver', description: 'Metallic silver' }, 'Red'],
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);
      expect(result.data?.models[0]?.columns[0]?.options).toEqual([
        'Black',
        { value: 'Silver', description: 'Metallic silver' },
        'Red',
      ]);
    });

    it('should parse dbt yml with boolean options', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'is_active',
                description: 'Active status',
                options: [true, false],
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);
      expect(result.data?.models[0]?.columns[0]?.options).toEqual([true, false]);
    });

    it('should parse dbt yml with numeric options', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'size',
                description: 'Product size',
                options: [1, 2, 3, 4, 5],
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);
      expect(result.data?.models[0]?.columns[0]?.options).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse dbt yml with columns having no options field', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'product_id',
                description: 'Product ID',
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);
      expect(result.data?.models[0]?.columns[0]?.options).toBeUndefined();
    });

    it('should parse complex real-world example with multiple columns', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            description: 'Product catalog',
            columns: [
              {
                name: 'product_id',
                description: 'Unique product identifier',
                data_type: 'integer',
              },
              {
                name: 'name',
                description: 'Product name',
                searchable: true,
              },
              {
                name: 'color',
                description: 'Product color',
                searchable: true,
                options: [
                  { value: 'Black', description: 'Matte black finish' },
                  { value: 'Silver', description: 'Metallic silver' },
                  'Red',
                  'Blue',
                ],
              },
              {
                name: 'size',
                description: 'Product size code',
                options: [1, 2, 3, 4, 5],
              },
              {
                name: 'in_stock',
                description: 'Stock availability',
                options: [
                  { value: true, description: 'Available in stock' },
                  { value: false, description: 'Out of stock' },
                ],
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);

      const model = result.data?.models[0];
      expect(model?.columns).toHaveLength(5);

      // Product ID - no options
      expect(model?.columns[0]?.options).toBeUndefined();

      // Name - no options, searchable
      expect(model?.columns[1]?.options).toBeUndefined();
      expect(model?.columns[1]?.searchable).toBe(true);

      // Color - mixed format options
      expect(model?.columns[2]?.options).toEqual([
        { value: 'Black', description: 'Matte black finish' },
        { value: 'Silver', description: 'Metallic silver' },
        'Red',
        'Blue',
      ]);

      // Size - numeric options
      expect(model?.columns[3]?.options).toEqual([1, 2, 3, 4, 5]);

      // In stock - boolean options with descriptions
      expect(model?.columns[4]?.options).toEqual([
        { value: true, description: 'Available in stock' },
        { value: false, description: 'Out of stock' },
      ]);
    });
  });

  describe('DbtFileSchema validation', () => {
    it('should validate complete dbt file with all features', () => {
      const dbtFile = {
        version: 2,
        models: [
          {
            name: 'orders',
            description: 'Order transactions',
            columns: [
              {
                name: 'status',
                description: 'Order status',
                options: [
                  { value: 'pending', description: 'Awaiting payment' },
                  { value: 'confirmed', description: 'Payment confirmed' },
                  { value: 'shipped', description: 'Order shipped' },
                  { value: 'delivered', description: 'Order delivered' },
                ],
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
                name: 'status',
                type: 'categorical',
                description: 'Order status',
              },
            ],
            measures: [],
          },
        ],
      };

      const result = DbtFileSchema.safeParse(dbtFile);
      expect(result.success).toBe(true);
    });
  });

  describe('config.meta.options compatibility', () => {
    it('should parse options from config.meta field (legacy format)', () => {
      const column = {
        name: 'color',
        description: 'Product color',
        config: {
          meta: {
            options: ['Black', 'Silver', 'Red'],
            searchable: true,
          },
        },
      };

      const result = DbtColumnSchema.safeParse(column);
      expect(result.success).toBe(true);
      // Note: config.meta.options is not validated by DbtColumnSchema's options field
      // It's extracted separately during transformation
      if (result.success) {
        expect(result.data.config?.meta?.options).toEqual(['Black', 'Silver', 'Red']);
      }
    });

    it('should parse options from both top-level and config.meta (top-level takes precedence)', () => {
      const dbtYml = {
        version: 2,
        models: [
          {
            name: 'product',
            columns: [
              {
                name: 'color',
                description: 'Product color',
                // Top-level options (higher precedence)
                options: ['Black', 'Silver', 'Red'],
                config: {
                  meta: {
                    // Meta options (lower precedence)
                    options: ['White', 'Grey'],
                  },
                },
              },
            ],
          },
        ],
      };

      const result = parseDbtFile(dbtYml);
      expect(result.success).toBe(true);

      const column = result.data?.models[0]?.columns[0];
      // Top-level options should be preserved
      expect(column?.options).toEqual(['Black', 'Silver', 'Red']);
      // Meta options should also be preserved (for precedence handling in transformer)
      expect(column?.config?.meta?.options).toEqual(['White', 'Grey']);
    });
  });
});
