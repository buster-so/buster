import { describe, expect, it } from 'vitest';
import { ModelSchema } from './schemas';

describe('ModelSchema', () => {
  it('should handle YAML block scalar descriptions', () => {
    const modelData = {
      name: 'employee_pay_history',
      description:
        'Historical record of employee pay rate changes sourced from HumanResources.EmployeePayHistory. Use it to analyze compensation changes over time, understand current vs prior rates, and join to employee attributes for HR analytics.',
      dimensions: [
        {
          name: 'businessentityid',
          description:
            'Employee identifier; join key to the employee model. Multiple rows per employee represent distinct pay changes over time.',
          type: 'integer',
          searchable: false,
        },
      ],
      measures: [],
      metrics: [],
      filters: [],
      relationships: [],
      clarifications: [
        'Confirm payfrequency code mapping: does 1 represent hourly and 2 represent salaried in this environment?',
        'For salaried employees, is rate stored as an hourly equivalent or another unit?',
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.clarifications).toHaveLength(2);
    }
  });

  it('should handle dimension options as objects with value and description', () => {
    const modelData = {
      name: 'test_model',
      dimensions: [
        {
          name: 'payfrequency',
          description: 'Code indicating the pay schedule',
          type: 'smallint',
          searchable: false,
          options: [
            { value: 1, description: 'Hourly schedule (typical)' },
            { value: 2, description: 'Salaried schedule (typical)' },
          ],
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions[0].options).toHaveLength(2);
      expect(result.data.dimensions[0].options?.[0]).toEqual({
        value: 1,
        description: 'Hourly schedule (typical)',
      });
    }
  });

  it('should handle dimension options as simple string array', () => {
    const modelData = {
      name: 'test_model',
      dimensions: [
        {
          name: 'status',
          description: 'Status field',
          type: 'string',
          options: ['active', 'inactive', 'pending'],
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions[0].options).toEqual(['active', 'inactive', 'pending']);
    }
  });

  it('should handle dimension options as number array', () => {
    const modelData = {
      name: 'test_model',
      dimensions: [
        {
          name: 'department_id',
          description: 'Department identifier',
          type: 'integer',
          options: [1, 2, 3, 4, 5, 10, 15],
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions[0].options).toEqual([1, 2, 3, 4, 5, 10, 15]);
    }
  });

  it('should handle dimension options as mixed array', () => {
    const modelData = {
      name: 'test_model',
      dimensions: [
        {
          name: 'mixed_field',
          description: 'Field with mixed option types',
          type: 'variant',
          options: [
            'string_option',
            123,
            { value: 'complex', description: 'A complex option' },
            { value: 456, description: 'Numeric with description' },
          ],
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions[0].options).toHaveLength(4);
      expect(result.data.dimensions[0].options?.[0]).toBe('string_option');
      expect(result.data.dimensions[0].options?.[1]).toBe(123);
      expect(result.data.dimensions[0].options?.[2]).toEqual({
        value: 'complex',
        description: 'A complex option',
      });
      expect(result.data.dimensions[0].options?.[3]).toEqual({
        value: 456,
        description: 'Numeric with description',
      });
    }
  });

  it('should handle dimension options with boolean values', () => {
    const modelData = {
      name: 'test_model',
      dimensions: [
        {
          name: 'is_active',
          description: 'Boolean field',
          type: 'boolean',
          options: [true, false],
        },
        {
          name: 'mixed_with_bool',
          type: 'variant',
          options: [
            'yes',
            'no',
            true,
            false,
            { value: true, description: 'Enabled' },
            { value: false, description: 'Disabled' },
          ],
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions[0].options).toEqual([true, false]);
      expect(result.data.dimensions[1].options).toEqual([
        'yes',
        'no',
        true,
        false,
        { value: true, description: 'Enabled' },
        { value: false, description: 'Disabled' },
      ]);
    }
  });

  it('should handle null options in dimensions', () => {
    const modelData = {
      name: 'test_model',
      dimensions: [
        {
          name: 'id',
          type: 'integer',
          options: null,
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dimensions[0].options).toBeNull();
    }
  });

  it('should handle optional fields correctly for CLI deployment', () => {
    const modelData = {
      name: 'test_model',
      // data_source_name, database, and schema are optional for CLI parsing
      // They will be filled in from buster.yml before sending to server
      dimensions: [
        {
          name: 'id',
          type: 'integer',
        },
      ],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data_source_name).toBeUndefined();
      expect(result.data.database).toBeUndefined();
      expect(result.data.schema).toBeUndefined();
      expect(result.data.dimensions).toHaveLength(1);
      expect(result.data.measures).toEqual([]);
      expect(result.data.metrics).toEqual([]);
      expect(result.data.filters).toEqual([]);
      expect(result.data.relationships).toEqual([]);
      expect(result.data.clarifications).toEqual([]);
    }
  });

  it('should parse a complete model from YAML-like structure', () => {
    const modelData = {
      name: 'employee_pay_history',
      description: 'Historical record of employee pay rate changes',
      dimensions: [
        {
          name: 'businessentityid',
          description: 'Employee identifier',
          type: 'integer',
          searchable: false,
        },
        {
          name: 'payfrequency',
          description: 'Code indicating the pay schedule',
          type: 'smallint',
          searchable: false,
          options: [
            { value: 1, description: 'Hourly schedule' },
            { value: 2, description: 'Salaried schedule' },
          ],
        },
      ],
      measures: [
        {
          name: 'rate',
          description: 'Pay rate amount',
          type: 'numeric',
        },
      ],
      metrics: [],
      filters: [
        {
          name: 'latest_rate_per_employee',
          description: 'Select only the most recent rate',
          expr: 'rateChangeDate = MAX(rateChangeDate) OVER (PARTITION BY businessEntityID)',
        },
      ],
      relationships: [
        {
          name: 'employee',
          description: 'Links pay history to employee',
          source_col: 'businessentityid',
          ref_col: 'businessentityid',
          cardinality: 'many-to-one',
        },
      ],
      clarifications: ['Confirm payfrequency code mapping', 'Is rate stored as hourly equivalent?'],
    };

    const result = ModelSchema.safeParse(modelData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('employee_pay_history');
      expect(result.data.dimensions).toHaveLength(2);
      expect(result.data.measures).toHaveLength(1);
      expect(result.data.filters).toHaveLength(1);
      expect(result.data.relationships).toHaveLength(1);
      expect(result.data.clarifications).toHaveLength(2);
    }
  });

  describe('{{TODO}} placeholder support', () => {
    it('should accept {{TODO}} in string fields', () => {
      const modelData = {
        name: 'test_model',
        description: '{{TODO}}',
        dimensions: [
          {
            name: 'field1',
            description: '{{TODO}} add description',
            type: '{{TODO}}',
            searchable: false,
          },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should accept {{TODO}} in dimension options arrays', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [
          {
            name: 'status',
            type: 'string',
            options: ['active', '{{TODO}}', 'inactive'],
            searchable: false,
          },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should accept {{TODO}} mixed with numbers in options', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [
          {
            name: 'department',
            type: 'integer',
            options: [1, 2, '{{TODO}}', 4, 5],
            searchable: false,
          },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should accept {{TODO}} in option object values and descriptions', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [
          {
            name: 'status',
            options: [
              { value: 1, description: 'Active' },
              { value: '{{TODO}}', description: '{{TODO}} determine status' },
              { value: 3, description: 'Inactive' },
            ],
            searchable: false,
          },
        ],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should accept {{TODO}} in metric and filter expressions', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [
          {
            name: 'total',
            expr: '{{TODO}}',
            description: 'Total calculation',
          },
        ],
        filters: [
          {
            name: 'active_only',
            expr: 'status = {{TODO}}',
            description: 'Filter for active items',
          },
        ],
        relationships: [],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should accept {{TODO}} in relationship columns', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [
          {
            name: 'user',
            source_col: '{{TODO}}',
            ref_col: 'users.id',
          },
          {
            name: 'product',
            source_col: 'product_id',
            ref_col: '{{TODO}}',
          },
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should accept {{TODO}} in clarifications', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'id', searchable: false }],
        measures: [],
        metrics: [],
        filters: [],
        relationships: [],
        clarifications: ['Normal clarification', '{{TODO}} verify this assumption'],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });
  });

  describe('unique name validation', () => {
    it('should reject duplicate dimension names', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [
          { name: 'id', type: 'integer', searchable: false },
          { name: 'name', type: 'string', searchable: true },
          { name: 'id', type: 'string', searchable: false }, // Duplicate
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Duplicate dimension name: id');
        expect(result.error.issues[0].path).toEqual(['dimensions']);
      }
    });

    it('should reject duplicate measure names', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'id', type: 'integer' }],
        measures: [
          { name: 'total', type: 'numeric' },
          { name: 'average', type: 'numeric' },
          { name: 'total', type: 'integer' }, // Duplicate
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Duplicate measure name: total');
        expect(result.error.issues[0].path).toEqual(['measures']);
      }
    });

    it('should reject duplicate metric names', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'id' }],
        metrics: [
          { name: 'revenue', expr: 'SUM(amount)' },
          { name: 'cost', expr: 'SUM(cost)' },
          { name: 'revenue', expr: 'AVG(amount)' }, // Duplicate
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Duplicate metric name: revenue');
        expect(result.error.issues[0].path).toEqual(['metrics']);
      }
    });

    it('should reject duplicate filter names', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'id' }],
        filters: [
          { name: 'active_only', expr: 'status = "active"' },
          { name: 'recent', expr: 'created_at > NOW() - INTERVAL 30 DAY' },
          { name: 'active_only', expr: 'is_active = true' }, // Duplicate
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Duplicate filter name: active_only');
        expect(result.error.issues[0].path).toEqual(['filters']);
      }
    });

    it('should allow same names across different arrays', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [{ name: 'total', type: 'integer' }],
        measures: [
          { name: 'count', type: 'integer' }, // Different from dimension name
        ],
        metrics: [
          { name: 'total', expr: 'SUM(amount)' }, // Same as dimension name, but different array
        ],
        filters: [
          { name: 'count', expr: 'count > 0' }, // Same as measure name, but different array
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });

    it('should handle multiple duplicates correctly', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'string' },
          { name: 'id', type: 'string' }, // First duplicate
          { name: 'id', type: 'varchar' }, // Second duplicate
          { name: 'name', type: 'text' }, // Another duplicate
        ],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should report the first duplicate found
        expect(result.error.issues[0].message).toMatch(/Duplicate dimension name: (id|name)/);
      }
    });

    it('should validate unique names with empty arrays', () => {
      const modelData = {
        name: 'test_model',
        dimensions: [],
        measures: [],
        metrics: [],
        filters: [],
      };

      const result = ModelSchema.safeParse(modelData);
      expect(result.success).toBe(true);
    });
  });
});
