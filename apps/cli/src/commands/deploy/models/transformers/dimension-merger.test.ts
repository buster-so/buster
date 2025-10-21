import type { Dimension } from '@buster/server-shared';
import { describe, expect, it } from 'vitest';
import type { DbtDimension } from '../dbt-schemas';
import {
  dimensionsMatch,
  isComplexExpression,
  mergeDimension,
  mergeDimensions,
  semanticDimensionToDimension,
} from './dimension-merger';

describe('dimension-merger', () => {
  describe('isComplexExpression', () => {
    it('should return false for simple column names', () => {
      expect(isComplexExpression('productID')).toBe(false);
      expect(isComplexExpression('name')).toBe(false);
      expect(isComplexExpression('created_at')).toBe(false);
    });

    it('should return false for undefined or empty', () => {
      expect(isComplexExpression(undefined)).toBe(false);
      expect(isComplexExpression('')).toBe(false);
    });

    it('should return true for CASE expressions', () => {
      expect(isComplexExpression('CASE WHEN sellEndDate IS NULL THEN true ELSE false END')).toBe(
        true
      );
      expect(isComplexExpression('case when status = 1 then "active" else "inactive" end')).toBe(
        true
      );
    });

    it('should return true for expressions with operators', () => {
      expect(isComplexExpression('price * quantity')).toBe(true);
      expect(isComplexExpression('first_name || " " || last_name')).toBe(true);
      expect(isComplexExpression('revenue - cost')).toBe(true);
    });

    it('should return true for function calls', () => {
      expect(isComplexExpression('CONCAT(first_name, last_name)')).toBe(true);
      expect(isComplexExpression('DATE_TRUNC("day", created_at)')).toBe(true);
      expect(isComplexExpression('COALESCE(email, "unknown")')).toBe(true);
    });

    it('should return true for expressions with comparisons', () => {
      expect(isComplexExpression('price > 100')).toBe(true);
      expect(isComplexExpression('status = "active"')).toBe(true);
      expect(isComplexExpression('deleted_at IS NULL')).toBe(true);
    });
  });

  describe('dimensionsMatch', () => {
    it('should match dimensions by exact name', () => {
      const columnDim: Dimension = {
        name: 'productName',
        type: 'string',
        searchable: true,
      };

      const semanticDim: DbtDimension = {
        name: 'productName',
        type: 'categorical',
      };

      expect(dimensionsMatch(columnDim, semanticDim)).toBe(true);
    });

    it('should match case-insensitively', () => {
      const columnDim: Dimension = {
        name: 'ProductName',
        type: 'string',
        searchable: false,
      };

      const semanticDim: DbtDimension = {
        name: 'productname',
        type: 'categorical',
      };

      expect(dimensionsMatch(columnDim, semanticDim)).toBe(true);
    });

    it('should match when semantic expr equals column name', () => {
      const columnDim: Dimension = {
        name: 'productID',
        type: 'string',
        searchable: true,
      };

      const semanticDim: DbtDimension = {
        name: 'product_id',
        type: 'categorical',
        expr: 'productID',
      };

      expect(dimensionsMatch(columnDim, semanticDim)).toBe(true);
    });

    it('should match when expr has extra whitespace', () => {
      const columnDim: Dimension = {
        name: 'productID',
        type: 'string',
        searchable: false,
      };

      const semanticDim: DbtDimension = {
        name: 'product',
        type: 'categorical',
        expr: '  productID  ',
      };

      expect(dimensionsMatch(columnDim, semanticDim)).toBe(true);
    });

    it('should not match when names and expr are different', () => {
      const columnDim: Dimension = {
        name: 'productID',
        type: 'string',
        searchable: false,
      };

      const semanticDim: DbtDimension = {
        name: 'category',
        type: 'categorical',
        expr: 'categoryName',
      };

      expect(dimensionsMatch(columnDim, semanticDim)).toBe(false);
    });

    it('should not match complex expressions', () => {
      const columnDim: Dimension = {
        name: 'sellEndDate',
        type: 'datetime',
        searchable: false,
      };

      const semanticDim: DbtDimension = {
        name: 'is_active',
        type: 'categorical',
        expr: 'CASE WHEN sellEndDate IS NULL THEN true ELSE false END',
      };

      expect(dimensionsMatch(columnDim, semanticDim)).toBe(false);
    });
  });

  describe('mergeDimension', () => {
    it('should merge simple column and semantic dimension', () => {
      const columnDim: Dimension = {
        name: 'color',
        description: 'Product color with detailed info',
        type: 'string',
        searchable: true,
        options: ['Red', 'Blue', 'Green'],
      };

      const semanticDim: DbtDimension = {
        name: 'color',
        description: 'Product color',
        type: 'categorical',
      };

      const merged = mergeDimension(columnDim, semanticDim);

      expect(merged.name).toBe('color');
      expect(merged.description).toBe('Product color with detailed info'); // Column wins
      expect(merged.type).toBe('string'); // Semantic wins (categorical normalized to string)
      expect(merged.searchable).toBe(true); // Column only
      expect(merged.options).toEqual(['Red', 'Blue', 'Green']); // Column only
    });

    it('should use semantic description when column has none', () => {
      const columnDim: Dimension = {
        name: 'status',
        type: 'string',
        searchable: false,
      };

      const semanticDim: DbtDimension = {
        name: 'status',
        description: 'Order status',
        type: 'categorical',
      };

      const merged = mergeDimension(columnDim, semanticDim);

      expect(merged.description).toBe('Order status');
    });

    it('should preserve column type when semantic has none', () => {
      const columnDim: Dimension = {
        name: 'email',
        type: 'string',
        searchable: true,
      };

      const semanticDim: DbtDimension = {
        name: 'email',
        description: 'User email',
      };

      const merged = mergeDimension(columnDim, semanticDim);

      expect(merged.type).toBe('string');
    });

    it('should add time_granularity from semantic dimension', () => {
      const columnDim: Dimension = {
        name: 'created_at',
        type: 'datetime',
        searchable: false,
      };

      const semanticDim: DbtDimension = {
        name: 'created_at',
        type: 'time',
        type_params: {
          time_granularity: 'day',
        },
      };

      const merged = mergeDimension(columnDim, semanticDim);

      expect(merged.type).toBe('time');
      expect((merged as any).time_granularity).toBe('day');
    });

    it('should preserve all column metadata', () => {
      const columnDim: Dimension = {
        name: 'productLine',
        description: 'Product line classification',
        type: 'string',
        searchable: false,
        options: ['R', 'M', 'T', 'S'],
      };

      const semanticDim: DbtDimension = {
        name: 'productLine',
        type: 'categorical',
      };

      const merged = mergeDimension(columnDim, semanticDim);

      expect(merged.options).toEqual(['R', 'M', 'T', 'S']);
      expect(merged.description).toBe('Product line classification');
      expect(merged.searchable).toBe(false);
    });
  });

  describe('semanticDimensionToDimension', () => {
    it('should convert semantic dimension to Buster dimension', () => {
      const semanticDim: DbtDimension = {
        name: 'is_active',
        description: 'Whether product is active',
        type: 'categorical',
        expr: 'CASE WHEN sellEndDate IS NULL THEN true ELSE false END',
      };

      const dimension = semanticDimensionToDimension(semanticDim);

      expect(dimension.name).toBe('is_active');
      expect(dimension.description).toBe('Whether product is active');
      expect(dimension.type).toBe('string'); // categorical normalized to string
      expect(dimension.searchable).toBe(false); // Default for semantic
    });

    it('should default type to string if not provided', () => {
      const semanticDim: DbtDimension = {
        name: 'custom_field',
        description: 'Custom field',
      };

      const dimension = semanticDimensionToDimension(semanticDim);

      expect(dimension.type).toBe('string');
    });

    it('should add time_granularity if present', () => {
      const semanticDim: DbtDimension = {
        name: 'order_date',
        type: 'time',
        type_params: {
          time_granularity: 'month',
        },
      };

      const dimension = semanticDimensionToDimension(semanticDim);

      expect(dimension.type).toBe('time');
      expect((dimension as any).time_granularity).toBe('month');
    });
  });

  describe('mergeDimensions', () => {
    it('should merge matching dimensions', () => {
      const columnDimensions: Dimension[] = [
        {
          name: 'name',
          description: 'Product name with details',
          type: 'string',
          searchable: true,
        },
        {
          name: 'color',
          description: 'Product color',
          type: 'string',
          searchable: false,
          options: ['Red', 'Blue', 'Green'],
        },
      ];

      const semanticDimensions: DbtDimension[] = [
        {
          name: 'name',
          description: 'Product name',
          type: 'categorical',
        },
        {
          name: 'color',
          type: 'categorical',
        },
      ];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      expect(merged).toHaveLength(2);

      // Check name dimension
      const nameDim = merged.find((d) => d.name === 'name');
      expect(nameDim).toBeDefined();
      expect(nameDim?.description).toBe('Product name with details'); // Column wins
      expect(nameDim?.type).toBe('string'); // Semantic wins (categorical normalized to string)
      expect(nameDim?.searchable).toBe(true); // Column only

      // Check color dimension
      const colorDim = merged.find((d) => d.name === 'color');
      expect(colorDim).toBeDefined();
      expect(colorDim?.options).toEqual(['Red', 'Blue', 'Green']); // Column only
      expect(colorDim?.type).toBe('string'); // Semantic wins (categorical normalized to string)
    });

    it('should keep complex semantic dimensions separate', () => {
      const columnDimensions: Dimension[] = [
        {
          name: 'sellEndDate',
          type: 'datetime',
          searchable: false,
        },
      ];

      const semanticDimensions: DbtDimension[] = [
        {
          name: 'is_active',
          type: 'categorical',
          expr: 'CASE WHEN sellEndDate IS NULL THEN true ELSE false END',
          description: 'Whether product is currently active',
        },
      ];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      expect(merged).toHaveLength(2); // Both should exist separately

      // Check both dimensions exist
      const sellEndDate = merged.find((d) => d.name === 'sellEndDate');
      const isActive = merged.find((d) => d.name === 'is_active');

      expect(sellEndDate).toBeDefined();
      expect(isActive).toBeDefined();
      expect(isActive?.description).toBe('Whether product is currently active');
    });

    it('should add unmatched column dimensions', () => {
      const columnDimensions: Dimension[] = [
        { name: 'productID', type: 'string', searchable: true },
        { name: 'name', type: 'string', searchable: true },
        { name: 'size', type: 'string', searchable: false },
      ];

      const semanticDimensions: DbtDimension[] = [{ name: 'name', type: 'categorical' }];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      expect(merged).toHaveLength(3); // All columns should be present

      // Check all exist
      expect(merged.find((d) => d.name === 'productID')).toBeDefined();
      expect(merged.find((d) => d.name === 'name')).toBeDefined();
      expect(merged.find((d) => d.name === 'size')).toBeDefined();
    });

    it('should add unmatched semantic dimensions', () => {
      const columnDimensions: Dimension[] = [
        { name: 'productID', type: 'string', searchable: true },
      ];

      const semanticDimensions: DbtDimension[] = [
        { name: 'productID', type: 'categorical' },
        { name: 'category', type: 'categorical', description: 'Product category' },
      ];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      expect(merged).toHaveLength(2);

      const category = merged.find((d) => d.name === 'category');
      expect(category).toBeDefined();
      expect(category?.description).toBe('Product category');
    });

    it('should handle time dimensions with granularity', () => {
      const columnDimensions: Dimension[] = [
        {
          name: 'created_at',
          type: 'datetime',
          description: 'Creation timestamp',
          searchable: false,
        },
      ];

      const semanticDimensions: DbtDimension[] = [
        {
          name: 'created_at',
          type: 'time',
          type_params: {
            time_granularity: 'day',
          },
        },
      ];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      expect(merged).toHaveLength(1);
      const dim = merged[0];
      expect(dim?.name).toBe('created_at');
      expect(dim?.type).toBe('time');
      expect((dim as any).time_granularity).toBe('day');
      expect(dim?.description).toBe('Creation timestamp'); // Column description preserved
    });

    it('should handle empty inputs', () => {
      expect(mergeDimensions([], [])).toHaveLength(0);
      expect(
        mergeDimensions([{ name: 'test', type: 'string', searchable: false }], [])
      ).toHaveLength(1);
      expect(mergeDimensions([], [{ name: 'test', type: 'categorical' }])).toHaveLength(1);
    });

    it('should match dimensions by expr when names differ', () => {
      const columnDimensions: Dimension[] = [
        {
          name: 'productID',
          type: 'string',
          searchable: true,
          description: 'Product identifier',
        },
      ];

      const semanticDimensions: DbtDimension[] = [
        {
          name: 'product_id',
          type: 'categorical',
          expr: 'productID', // References column by name
        },
      ];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      expect(merged).toHaveLength(1); // Should merge, not duplicate
      expect(merged[0]?.name).toBe('productID'); // Column name wins
      expect(merged[0]?.searchable).toBe(true); // Column metadata preserved
      expect(merged[0]?.type).toBe('string'); // Semantic type wins (categorical normalized to string)
    });

    it('should handle real-world product example', () => {
      const columnDimensions: Dimension[] = [
        {
          name: 'name',
          description: 'Human-readable product name with descriptive attributes',
          type: 'string',
          searchable: true,
        },
        {
          name: 'color',
          description: 'Product color attribute',
          type: 'string',
          searchable: true,
          options: ['Black', 'Silver', 'Red', 'Blue', 'Green'],
        },
        {
          name: 'sellStartDate',
          description: 'Date when product became available',
          type: 'datetime',
          searchable: false,
        },
        {
          name: 'sellEndDate',
          description: 'Date when product was discontinued',
          type: 'datetime',
          searchable: false,
        },
      ];

      const semanticDimensions: DbtDimension[] = [
        {
          name: 'sellStartDate',
          type: 'time',
          type_params: { time_granularity: 'day' },
        },
        {
          name: 'name',
          type: 'categorical',
        },
        {
          name: 'color',
          type: 'categorical',
        },
        {
          name: 'is_active',
          type: 'categorical',
          expr: 'CASE WHEN sellEndDate IS NULL THEN true ELSE false END',
          description: 'Whether product is currently active',
        },
      ];

      const merged = mergeDimensions(columnDimensions, semanticDimensions);

      // Should have 5 dimensions: name, color, sellStartDate, sellEndDate, is_active
      expect(merged).toHaveLength(5);

      // Check merged dimensions preserve column metadata
      const name = merged.find((d) => d.name === 'name');
      expect(name?.searchable).toBe(true);
      expect(name?.description).toBe('Human-readable product name with descriptive attributes');
      expect(name?.type).toBe('string'); // categorical normalized to string

      const color = merged.find((d) => d.name === 'color');
      expect(color?.options).toEqual(['Black', 'Silver', 'Red', 'Blue', 'Green']);
      expect(color?.type).toBe('string'); // categorical normalized to string

      const sellStartDate = merged.find((d) => d.name === 'sellStartDate');
      expect(sellStartDate?.type).toBe('time');
      expect((sellStartDate as any).time_granularity).toBe('day');

      // Check complex dimension is separate
      const isActive = merged.find((d) => d.name === 'is_active');
      expect(isActive).toBeDefined();
      expect(isActive?.description).toBe('Whether product is currently active');

      // Check sellEndDate still exists
      const sellEndDate = merged.find((d) => d.name === 'sellEndDate');
      expect(sellEndDate).toBeDefined();
    });
  });
});
