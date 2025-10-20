import { describe, expect, it } from 'vitest';
import type { DbtColumn } from './dbt-schemas';
import { inferDimensionType, inferNumericType, isNumericColumn } from './dbt-type-inference';

describe('dbt-type-inference', () => {
  describe('isNumericColumn', () => {
    describe('data_type field detection (highest priority)', () => {
      it('should detect numeric column with integer data_type', () => {
        const column: DbtColumn = {
          name: 'user_count',
          data_type: 'integer',
        };

        expect(isNumericColumn(column)).toBe(true);
      });

      it('should detect numeric column with decimal data_type', () => {
        const column: DbtColumn = {
          name: 'amount',
          data_type: 'decimal',
        };

        expect(isNumericColumn(column)).toBe(true);
      });

      it('should detect numeric column with bigint data_type', () => {
        const column: DbtColumn = {
          name: 'id',
          data_type: 'bigint',
        };

        expect(isNumericColumn(column)).toBe(true);
      });

      it('should detect non-numeric column with varchar data_type', () => {
        const column: DbtColumn = {
          name: 'customer_name',
          data_type: 'varchar',
        };

        expect(isNumericColumn(column)).toBe(false);
      });

      it('should detect non-numeric column with timestamp data_type', () => {
        const column: DbtColumn = {
          name: 'created_at',
          data_type: 'timestamp',
        };

        expect(isNumericColumn(column)).toBe(false);
      });

      it('should prioritize data_type over name patterns', () => {
        const column: DbtColumn = {
          name: 'total_count', // Name suggests numeric
          data_type: 'varchar', // But type says non-numeric
        };

        expect(isNumericColumn(column)).toBe(false);
      });
    });

    describe('meta field detection', () => {
      it('should detect numeric column with unit meta field', () => {
        const column: DbtColumn = {
          name: 'revenue',
          config: { meta: { unit: 'USD' } },
        };

        expect(isNumericColumn(column)).toBe(true);
      });

      it('should detect non-numeric column with categorical meta', () => {
        const column: DbtColumn = {
          name: 'status',
          config: { meta: { categorical: true } },
        };

        expect(isNumericColumn(column)).toBe(false);
      });

      it('should detect non-numeric column with options meta', () => {
        const column: DbtColumn = {
          name: 'category',
          config: { meta: { options: ['A', 'B', 'C'] } },
        };

        expect(isNumericColumn(column)).toBe(false);
      });

      it('should prioritize categorical meta over name patterns', () => {
        const column: DbtColumn = {
          name: 'count', // Numeric name pattern
          config: { meta: { categorical: true } }, // But explicitly categorical
        };

        expect(isNumericColumn(column)).toBe(false);
      });
    });

    describe('name pattern detection', () => {
      it('should detect numeric column by ID suffix', () => {
        expect(isNumericColumn({ name: 'customer_id' })).toBe(false); // IDs are identifiers, not measures
      });

      it('should detect numeric column by count/total prefixes', () => {
        expect(isNumericColumn({ name: 'count_orders' })).toBe(true);
        expect(isNumericColumn({ name: 'total_revenue' })).toBe(true);
        expect(isNumericColumn({ name: 'sum_sales' })).toBe(true);
        expect(isNumericColumn({ name: 'avg_price' })).toBe(true);
        expect(isNumericColumn({ name: 'max_value' })).toBe(true);
        expect(isNumericColumn({ name: 'min_value' })).toBe(true);
      });

      it('should detect numeric column by common numeric suffixes', () => {
        expect(isNumericColumn({ name: 'revenue_amount' })).toBe(true);
        expect(isNumericColumn({ name: 'sale_price' })).toBe(true);
        expect(isNumericColumn({ name: 'product_cost' })).toBe(true);
        expect(isNumericColumn({ name: 'order_total' })).toBe(true);
        expect(isNumericColumn({ name: 'item_quantity' })).toBe(true);
      });

      it('should detect text column by common text suffixes', () => {
        expect(isNumericColumn({ name: 'customer_name' })).toBe(false);
        expect(isNumericColumn({ name: 'product_title' })).toBe(false);
        expect(isNumericColumn({ name: 'user_email' })).toBe(false);
        expect(isNumericColumn({ name: 'order_status' })).toBe(false);
        expect(isNumericColumn({ name: 'item_type' })).toBe(false);
        expect(isNumericColumn({ name: 'product_category' })).toBe(false);
      });
    });

    describe('description keyword detection', () => {
      it('should detect numeric column by description keywords', () => {
        expect(isNumericColumn({ name: 'value', description: 'The amount of the sale' })).toBe(
          true
        );
        expect(isNumericColumn({ name: 'metric', description: 'Number of transactions' })).toBe(
          true
        );
        expect(isNumericColumn({ name: 'data', description: 'Count of items' })).toBe(true);
        expect(isNumericColumn({ name: 'field', description: 'Total revenue in USD' })).toBe(true);
      });

      it('should detect text column by description keywords', () => {
        expect(isNumericColumn({ name: 'value', description: 'The name of the customer' })).toBe(
          false
        );
        expect(isNumericColumn({ name: 'field', description: 'Email address' })).toBe(false);
        expect(isNumericColumn({ name: 'data', description: 'Category or type of product' })).toBe(
          false
        );
      });

      it('should be case-insensitive for description keywords', () => {
        expect(isNumericColumn({ name: 'value', description: 'TOTAL AMOUNT' })).toBe(true);
        expect(isNumericColumn({ name: 'field', description: 'Customer NAME' })).toBe(false);
      });
    });

    describe('default behavior', () => {
      it('should default to non-numeric for ambiguous columns', () => {
        expect(isNumericColumn({ name: 'unknown_field' })).toBe(false);
        expect(isNumericColumn({ name: 'data' })).toBe(false);
        expect(isNumericColumn({ name: 'value' })).toBe(false);
      });

      it('should handle columns with no description', () => {
        expect(isNumericColumn({ name: 'mystery_column' })).toBe(false);
      });
    });
  });

  describe('inferNumericType', () => {
    describe('with data_type field', () => {
      it('should infer integer type from integer data_type', () => {
        expect(inferNumericType({ name: 'amount', data_type: 'integer' })).toBe('integer');
        expect(inferNumericType({ name: 'total', data_type: 'bigint' })).toBe('integer');
      });

      it('should infer decimal type from decimal/numeric data_type', () => {
        expect(inferNumericType({ name: 'price', data_type: 'decimal' })).toBe('decimal');
        expect(inferNumericType({ name: 'amount', data_type: 'numeric' })).toBe('decimal');
        expect(inferNumericType({ name: 'cost', data_type: 'decimal(10,2)' })).toBe('decimal');
      });

      it('should infer float type from float data_type', () => {
        expect(inferNumericType({ name: 'value', data_type: 'float' })).toBe('float');
        expect(inferNumericType({ name: 'score', data_type: 'double' })).toBe('float');
      });
    });

    describe('without data_type field (heuristics)', () => {
      it('should infer integer type for count columns', () => {
        expect(inferNumericType({ name: 'count_orders' })).toBe('integer');
        expect(inferNumericType({ name: 'total_count' })).toBe('integer');
      });

      it('should infer decimal type for amount/price columns', () => {
        expect(inferNumericType({ name: 'total_amount' })).toBe('decimal');
        expect(inferNumericType({ name: 'unit_price' })).toBe('decimal');
        expect(inferNumericType({ name: 'total_cost' })).toBe('decimal');
      });

      it('should infer float type for quantity columns', () => {
        expect(inferNumericType({ name: 'quantity' })).toBe('float');
        expect(inferNumericType({ name: 'item_qty' })).toBe('float');
      });

      it('should default to float type for unknown numeric columns', () => {
        expect(inferNumericType({ name: 'mystery_number' })).toBe('float');
      });
    });
  });

  describe('inferDimensionType', () => {
    describe('with data_type field', () => {
      it('should infer datetime type from timestamp data_type', () => {
        expect(inferDimensionType({ name: 'created', data_type: 'timestamp' })).toBe('datetime');
        expect(inferDimensionType({ name: 'updated', data_type: 'datetime' })).toBe('datetime');
        expect(inferDimensionType({ name: 'date', data_type: 'date' })).toBe('datetime');
      });

      it('should infer boolean type from boolean data_type', () => {
        expect(inferDimensionType({ name: 'active', data_type: 'boolean' })).toBe('boolean');
        expect(inferDimensionType({ name: 'flag', data_type: 'bool' })).toBe('boolean');
      });

      it('should infer string type from varchar/text data_type', () => {
        expect(inferDimensionType({ name: 'name', data_type: 'varchar' })).toBe('string');
        expect(inferDimensionType({ name: 'description', data_type: 'text' })).toBe('string');
      });
    });

    describe('without data_type field (heuristics)', () => {
      it('should infer string type for name columns', () => {
        expect(inferDimensionType({ name: 'customer_name' })).toBe('string');
        expect(inferDimensionType({ name: 'product_title' })).toBe('string');
      });

      it('should infer string type for email columns', () => {
        expect(inferDimensionType({ name: 'user_email' })).toBe('string');
        expect(inferDimensionType({ name: 'contact_email' })).toBe('string');
      });

      it('should infer string type for status/type/category columns', () => {
        expect(inferDimensionType({ name: 'order_status' })).toBe('string');
        expect(inferDimensionType({ name: 'product_type' })).toBe('string');
        expect(inferDimensionType({ name: 'item_category' })).toBe('string');
      });

      it('should infer datetime type for date columns', () => {
        expect(inferDimensionType({ name: 'created_at' })).toBe('datetime');
        expect(inferDimensionType({ name: 'updated_at' })).toBe('datetime');
        expect(inferDimensionType({ name: 'order_date' })).toBe('datetime');
      });

      it('should infer boolean type for is_/has_ columns', () => {
        expect(inferDimensionType({ name: 'is_active' })).toBe('boolean');
        expect(inferDimensionType({ name: 'has_subscription' })).toBe('boolean');
      });

      it('should infer string type for ID columns (identifiers, not measures)', () => {
        expect(inferDimensionType({ name: 'customer_id' })).toBe('string');
        expect(inferDimensionType({ name: 'user_id' })).toBe('string');
      });

      it('should default to string type for unknown columns', () => {
        expect(inferDimensionType({ name: 'mystery_field' })).toBe('string');
      });
    });
  });
});
