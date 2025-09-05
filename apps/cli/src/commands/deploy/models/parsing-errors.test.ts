import { describe, expect, it } from 'vitest';
import type { ZodIssue } from 'zod';
import { formatZodIssuesWithContext } from './parsing';

describe('formatZodIssuesWithContext', () => {
  it('should format dimension errors with dimension names', () => {
    const data = {
      name: 'products',
      dimensions: [
        { name: 'id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' },
        {
          name: 'status',
          type: 'string',
          options: [
            { invalid: 'field' }, // This will cause an error
          ],
        },
      ],
    };

    const issues: ZodIssue[] = [
      {
        code: 'invalid_union',
        path: ['dimensions', 3, 'options', 0],
        message: 'Invalid input',
        unionErrors: [],
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe(`dimension 'status'.options.option 1: Invalid input`);
  });

  it('should format measure errors with measure names', () => {
    const data = {
      name: 'sales',
      measures: [
        { name: 'total_sales', type: 'sum' },
        { name: 'avg_price', type: 'invalid_type' }, // This will cause an error
      ],
    };

    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        path: ['measures', 1, 'type'],
        message: 'Invalid type',
        expected: 'string',
        received: 'undefined',
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe(`measure 'avg_price'.type: Invalid type`);
  });

  it('should format metric errors with metric names', () => {
    const data = {
      name: 'orders',
      metrics: [
        { name: 'revenue', expr: 'SUM(amount)' },
        { name: 'profit_margin', expr: '' }, // Empty expression will cause error
      ],
    };

    const issues: ZodIssue[] = [
      {
        code: 'too_small',
        path: ['metrics', 1, 'expr'],
        message: 'String must contain at least 1 character(s)',
        minimum: 1,
        type: 'string',
        inclusive: true,
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe(
      `metric 'profit_margin'.expr: String must contain at least 1 character(s)`
    );
  });

  it('should format filter errors with filter names', () => {
    const data = {
      name: 'customers',
      filters: [
        { name: 'active_only', expr: 'status = "active"' },
        { name: 'premium', description: 'Premium customers' }, // Missing expr
      ],
    };

    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        path: ['filters', 1, 'expr'],
        message: 'Required',
        expected: 'string',
        received: 'undefined',
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe(`filter 'premium'.expr: Required`);
  });

  it('should format relationship errors with relationship names', () => {
    const data = {
      name: 'orders',
      relationships: [
        {
          name: 'customer',
          ref_table: 'customers',
          ref_col: 'id',
          // Missing source_col
        },
      ],
    };

    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        path: ['relationships', 0, 'source_col'],
        message: 'Required',
        expected: 'string',
        received: 'undefined',
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe(`relationship 'customer'.source_col: Required`);
  });

  it('should handle nested option errors', () => {
    const data = {
      name: 'products',
      dimensions: [
        {
          name: 'size',
          type: 'string',
          options: [
            'small',
            'medium',
            { value: 'large', description: 'Large size' },
            { invalid: true }, // This will cause an error
          ],
        },
      ],
    };

    const issues: ZodIssue[] = [
      {
        code: 'invalid_union',
        path: ['dimensions', 0, 'options', 3],
        message: 'Invalid option format',
        unionErrors: [],
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe(`dimension 'size'.options.option 4: Invalid option format`);
  });

  it('should handle top-level field errors', () => {
    const data = {
      // Missing name field
      dimensions: [],
    };

    const issues: ZodIssue[] = [
      {
        code: 'invalid_type',
        path: ['name'],
        message: 'Required',
        expected: 'string',
        received: 'undefined',
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe('name: Required');
  });

  it('should handle empty path', () => {
    const data = {};

    const issues: ZodIssue[] = [
      {
        code: 'custom',
        path: [],
        message: 'Invalid model structure',
      },
    ];

    const formatted = formatZodIssuesWithContext(issues, data);

    expect(formatted[0]).toBe('Invalid model structure');
  });
});
