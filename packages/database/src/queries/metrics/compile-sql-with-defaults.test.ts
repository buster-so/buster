import { describe, expect, it } from 'vitest';
import { compileSqlWithDefaults } from './compile-sql-with-defaults';
import type { MetricContent } from './get-metric-with-data-source';

describe('compileSqlWithDefaults', () => {
  it('should compile SQL with filter defaults applied', () => {
    const metric: MetricContent = {
      name: 'Test Metric',
      sql: `
        SELECT * 
        FROM orders o
        WHERE {{date_filter}}
        AND {{status_filter}}
      `,
      filters: [
        {
          key: 'date_filter',
          column: 'o.created_at',
          type: 'daterange',
          mode: 'range',
          default: ['2024-01-01', '2024-12-31'],
        },
        {
          key: 'status_filter',
          column: 'o.status',
          type: 'string',
          mode: 'predicate',
          default: 'completed',
        },
      ],
    };

    const compiled = compileSqlWithDefaults(metric);
    expect(compiled).toContain("o.created_at >= '2024-01-01'");
    expect(compiled).toContain("o.created_at < '2024-12-31'");
    expect(compiled).toContain("o.status = 'completed'");
  });

  it('should remove filters without defaults', () => {
    const metric: MetricContent = {
      name: 'Test Metric',
      sql: `
        SELECT * 
        FROM orders
        WHERE 1=1
        {{optional_filter}}
      `,
      filters: [
        {
          key: 'optional_filter',
          column: 'status',
          type: 'string',
          mode: 'predicate',
          // No default provided
        },
      ],
    };

    const compiled = compileSqlWithDefaults(metric);
    expect(compiled).not.toContain('{{optional_filter}}');
    expect(compiled).toContain('WHERE 1=1');
  });

  it('should handle qualified column names with table aliases', () => {
    const metric: MetricContent = {
      name: 'Test Metric',
      sql: `
        SELECT * 
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE {{customer_filter}}
      `,
      filters: [
        {
          key: 'customer_filter',
          column: 'c.customer_name',
          type: 'string',
          mode: 'predicate',
          default: 'Acme Corp',
        },
      ],
    };

    const compiled = compileSqlWithDefaults(metric);
    expect(compiled).toContain("c.customer_name = 'Acme Corp'");
  });

  it('should preserve indentation', () => {
    const metric: MetricContent = {
      name: 'Test Metric',
      sql: `
        SELECT * 
        FROM orders
        WHERE 1=1
          {{indented_filter}}
      `,
      filters: [
        {
          key: 'indented_filter',
          column: 'status',
          type: 'string',
          mode: 'predicate',
          default: 'active',
          needsLeadingAnd: true,
        },
      ],
    };

    const compiled = compileSqlWithDefaults(metric);
    expect(compiled).toMatch(/\s+AND status = 'active'/);
  });

  it('should handle EXTRACT() functions with date values', () => {
    const metric: MetricContent = {
      name: 'Total Orders Count with Time Filter',
      sql: `
        SELECT 
          SUM(no.metric_numberoforders) as total_orders
        FROM postgres.ont_ont.number_of_orders no
        WHERE (no.year > EXTRACT(YEAR FROM {{start_date}}) 
               OR (no.year = EXTRACT(YEAR FROM {{start_date}}) AND no.month >= EXTRACT(MONTH FROM {{start_date}})))
          AND (no.year < EXTRACT(YEAR FROM {{end_date}}) 
               OR (no.year = EXTRACT(YEAR FROM {{end_date}}) AND no.month <= EXTRACT(MONTH FROM {{end_date}})))
      `,
      filters: [
        {
          key: 'start_date',
          column: 'no.year', // Not actually used in 'value' mode
          type: 'date',
          mode: 'value' as any, // New mode to just replace with value
          default: '2025-07-01',
          required: true,
        },
        {
          key: 'end_date', 
          column: 'no.year', // Not actually used in 'value' mode
          type: 'date',
          mode: 'value' as any, // New mode to just replace with value
          default: '2025-09-30',
          required: true,
        },
      ],
    };

    const compiled = compileSqlWithDefaults(metric);
    expect(compiled).toContain("EXTRACT(YEAR FROM '2025-07-01')");
    expect(compiled).toContain("EXTRACT(MONTH FROM '2025-07-01')");
    expect(compiled).toContain("EXTRACT(YEAR FROM '2025-09-30')");
    expect(compiled).toContain("EXTRACT(MONTH FROM '2025-09-30')");
    expect(compiled).not.toContain("{{start_date}}");
    expect(compiled).not.toContain("{{end_date}}");
  });
});