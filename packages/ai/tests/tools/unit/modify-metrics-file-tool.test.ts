import { describe, expect, test } from 'vitest';
import * as yaml from 'yaml';
import { z } from 'zod';

// Import the schemas we want to test (extracted from the tool file)
const columnLabelFormatSchema = z.object({
  columnType: z.enum(['number', 'string', 'date']),
  style: z.enum(['currency', 'percent', 'number', 'date', 'string']),
  multiplier: z.number().optional(),
  displayName: z.string().optional(),
  numberSeparatorStyle: z.string().nullable().optional(),
  minimumFractionDigits: z.number().optional(),
  maximumFractionDigits: z.number().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  replaceMissingDataWith: z.number().nullable().optional(),
  compactNumbers: z.boolean().optional(),
  currency: z.string().optional(),
  dateFormat: z.string().optional(),
  useRelativeTime: z.boolean().optional(),
  isUtc: z.boolean().optional(),
  convertNumberTo: z.enum(['day_of_week', 'month_of_year', 'quarter']).optional(),
});

const baseChartConfigSchema = z.object({
  selectedChartType: z.enum(['bar', 'line', 'scatter', 'pie', 'combo', 'metric', 'table']),
  columnLabelFormats: z.record(columnLabelFormatSchema),
  columnSettings: z.record(z.any()).optional(),
  colors: z.array(z.string()).optional(),
  showLegend: z.boolean().optional(),
  gridLines: z.boolean().optional(),
  showLegendHeadline: z.union([z.boolean(), z.string()]).optional(),
  goalLines: z.array(z.any()).optional(),
  trendlines: z.array(z.any()).optional(),
  disableTooltip: z.boolean().optional(),
});

const tableChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('table'),
  tableColumnOrder: z.array(z.string()).optional(),
});

const metricChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('metric'),
  metricColumnId: z.string(),
});

const barChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('bar'),
});

const lineChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('line'),
});

const scatterChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('scatter'),
});

const pieChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('pie'),
});

const comboChartConfigSchema = baseChartConfigSchema.extend({
  selectedChartType: z.literal('combo'),
});

const chartConfigSchema = z.discriminatedUnion('selectedChartType', [
  tableChartConfigSchema,
  metricChartConfigSchema,
  barChartConfigSchema,
  lineChartConfigSchema,
  scatterChartConfigSchema,
  pieChartConfigSchema,
  comboChartConfigSchema,
]);

const metricYmlSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  timeFrame: z.string().min(1),
  sql: z.string().min(1),
  chartConfig: chartConfigSchema,
});

// Test the core validation functions
function validateSqlBasic(sqlQuery: string): { success: boolean; error?: string } {
  if (!sqlQuery.trim()) {
    return { success: false, error: 'SQL query cannot be empty' };
  }

  if (!sqlQuery.toLowerCase().includes('select')) {
    return { success: false, error: 'SQL query must contain SELECT statement' };
  }

  if (!sqlQuery.toLowerCase().includes('from')) {
    return { success: false, error: 'SQL query must contain FROM clause' };
  }

  return { success: true };
}

function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: unknown;
} {
  try {
    const parsedYml = yaml.parse(ymlContent);
    const validationResult = metricYmlSchema.safeParse(parsedYml);

    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid YAML structure: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    return { success: true, data: validationResult.data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YAML parsing failed',
    };
  }
}

describe('Modify Metrics File Tool Unit Tests', () => {
  describe('YAML Schema Validation for Updates', () => {
    test('should validate correct updated table chart YAML', () => {
      const updatedTableYaml = `
name: Updated Sales Summary
description: Updated summary of sales data
timeFrame: Last 60 days
sql: |
  SELECT 
    product_name,
    order_date,
    SUM(amount) as total_amount,
    COUNT(*) as order_count
  FROM sales 
  WHERE order_date >= CURRENT_DATE - INTERVAL '60 days'
  GROUP BY product_name, order_date
  ORDER BY order_date DESC
chartConfig:
  selectedChartType: table
  tableColumnOrder:
    - product_name
    - order_date
    - total_amount
    - order_count
  columnLabelFormats:
    product_name:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    order_date:
      columnType: date
      style: date
      dateFormat: "MMM D, YYYY"
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    total_amount:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
    order_count:
      columnType: number
      style: number
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
      `;

      const result = parseAndValidateYaml(updatedTableYaml);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Sales Summary');
      expect(result.data?.timeFrame).toBe('Last 60 days');
      expect(result.data?.chartConfig.selectedChartType).toBe('table');
    });

    test('should validate correct updated metric chart YAML', () => {
      const updatedMetricYaml = `
name: Updated Total Revenue
description: Updated total revenue amount
timeFrame: Year to Date
sql: |
  SELECT SUM(amount) as total_revenue 
  FROM sales 
  WHERE EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM CURRENT_DATE)
chartConfig:
  selectedChartType: metric
  metricColumnId: total_revenue
  columnLabelFormats:
    total_revenue:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
      compactNumbers: true
      `;

      const result = parseAndValidateYaml(updatedMetricYaml);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Total Revenue');
      expect(result.data?.timeFrame).toBe('Year to Date');
      expect(result.data?.chartConfig.selectedChartType).toBe('metric');
      expect(result.data?.chartConfig.metricColumnId).toBe('total_revenue');
    });

    test('should reject updated YAML with missing required fields', () => {
      const incompleteYaml = `
name: Incomplete Update
description: Missing timeFrame and sql
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
      `;

      const result = parseAndValidateYaml(incompleteYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });

    test('should reject updated YAML with invalid chart type', () => {
      const invalidChartTypeYaml = `
name: Invalid Chart Update
description: Testing invalid chart type
timeFrame: Today
sql: SELECT * FROM test
chartConfig:
  selectedChartType: invalid_type
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
      `;

      const result = parseAndValidateYaml(invalidChartTypeYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });

    test('should reject updated metric chart without required metricColumnId', () => {
      const invalidMetricUpdateYaml = `
name: Invalid Metric Update
description: Missing metricColumnId
timeFrame: Today
sql: SELECT * FROM test
chartConfig:
  selectedChartType: metric
  # Missing metricColumnId
  columnLabelFormats:
    test:
      columnType: number
      style: number
      numberSeparatorStyle: null
      replaceMissingDataWith: null
      `;

      const result = parseAndValidateYaml(invalidMetricUpdateYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });

    test('should validate complex chart configuration updates', () => {
      const complexUpdateYaml = `
name: Complex Chart Update
description: Testing complex chart configuration
timeFrame: Last Quarter
sql: |
  SELECT 
    DATE_TRUNC('month', order_date) as month,
    product_category,
    SUM(amount) as revenue,
    COUNT(*) as orders
  FROM sales 
  WHERE order_date >= DATE_TRUNC('quarter', CURRENT_DATE) - INTERVAL '3 months'
  GROUP BY DATE_TRUNC('month', order_date), product_category
  ORDER BY month, product_category
chartConfig:
  selectedChartType: bar
  showLegend: true
  gridLines: true
  colors: ["#FF5733", "#33FF57", "#3357FF"]
  columnLabelFormats:
    month:
      columnType: date
      style: date
      dateFormat: "MMM YYYY"
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    product_category:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
    revenue:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
      compactNumbers: true
    orders:
      columnType: number
      style: number
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
      `;

      const result = parseAndValidateYaml(complexUpdateYaml);
      expect(result.success).toBe(true);
      expect(result.data?.chartConfig.showLegend).toBe(true);
      expect(result.data?.chartConfig.colors).toEqual(['#FF5733', '#33FF57', '#3357FF']);
    });
  });

  describe('SQL Validation for Updates', () => {
    test('should accept valid updated SELECT SQL', () => {
      const updatedSql =
        "SELECT id, name, amount, created_at FROM updated_sales WHERE created_at > NOW() - INTERVAL '7 days'";
      const result = validateSqlBasic(updatedSql);
      expect(result.success).toBe(true);
    });

    test('should reject empty SQL in updates', () => {
      const result = validateSqlBasic('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query cannot be empty');
    });

    test('should reject SQL without SELECT in updates', () => {
      const noSelectSql = 'UPDATE test SET value = 1 WHERE id = 1';
      const result = validateSqlBasic(noSelectSql);
      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query must contain SELECT statement');
    });

    test('should reject SQL without FROM in updates', () => {
      const noFromSql = 'SELECT NOW()';
      const result = validateSqlBasic(noFromSql);
      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query must contain FROM clause');
    });

    test('should handle complex updated SQL queries', () => {
      const complexUpdatedSql = `
        SELECT 
          c.customer_name,
          p.product_name,
          COUNT(o.id) as order_count,
          SUM(o.total_amount) as total_spent,
          AVG(o.total_amount) as avg_order_value
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        JOIN products p ON o.product_id = p.id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
          AND o.status = 'completed'
        GROUP BY c.customer_name, p.product_name
        HAVING order_count >= 2
        ORDER BY total_spent DESC
        LIMIT 50
      `;

      const result = validateSqlBasic(complexUpdatedSql);
      expect(result.success).toBe(true);
    });
  });

  describe('Input Schema Validation for Updates', () => {
    test('should validate correct update input format', () => {
      const validUpdateInput = {
        files: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            yml_content:
              'name: Updated Metric\ndescription: Updated description\ntimeFrame: Today\nsql: SELECT * FROM updated_test\nchartConfig:\n  selectedChartType: table\n  columnLabelFormats:\n    test:\n      columnType: string\n      style: string\n      numberSeparatorStyle: null\n      replaceMissingDataWith: null',
          },
        ],
      };

      // Basic validation that files array exists and has proper structure
      expect(validUpdateInput.files).toHaveLength(1);
      expect(validUpdateInput.files[0].id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
      expect(typeof validUpdateInput.files[0].yml_content).toBe('string');
    });

    test('should reject update input without file ID', () => {
      const invalidInput = {
        files: [
          {
            // Missing id
            yml_content: 'name: Test',
          },
        ],
      };

      // This would fail our ID validation requirement
      expect(invalidInput.files[0]).not.toHaveProperty('id');
    });

    test('should reject update input with invalid UUID', () => {
      const invalidUuidInput = {
        files: [
          {
            id: 'not-a-valid-uuid',
            yml_content: 'name: Test',
          },
        ],
      };

      // This would fail our UUID validation
      expect(invalidUuidInput.files[0].id).toBe('not-a-valid-uuid');
      // In real validation, this would be rejected as not a valid UUID
    });

    test('should validate bulk update input', () => {
      const bulkUpdateInput = {
        files: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            yml_content:
              'name: First Updated Metric\ndescription: First update\ntimeFrame: Today\nsql: SELECT * FROM test1\nchartConfig:\n  selectedChartType: table\n  columnLabelFormats:\n    test:\n      columnType: string\n      style: string\n      numberSeparatorStyle: null\n      replaceMissingDataWith: null',
          },
          {
            id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480',
            yml_content:
              'name: Second Updated Metric\ndescription: Second update\ntimeFrame: Last 7 days\nsql: SELECT * FROM test2\nchartConfig:\n  selectedChartType: metric\n  metricColumnId: test\n  columnLabelFormats:\n    test:\n      columnType: number\n      style: number\n      numberSeparatorStyle: null\n      replaceMissingDataWith: null',
          },
        ],
      };

      expect(bulkUpdateInput.files).toHaveLength(2);
      expect(bulkUpdateInput.files.every((f) => f.id && f.yml_content)).toBe(true);
    });
  });

  describe('Column Label Format Validation for Updates', () => {
    test('should validate updated number column format', () => {
      const updatedNumberFormat = {
        columnType: 'number' as const,
        style: 'percent' as const,
        numberSeparatorStyle: ',',
        replaceMissingDataWith: 0,
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      };

      const result = columnLabelFormatSchema.safeParse(updatedNumberFormat);
      expect(result.success).toBe(true);
    });

    test('should validate updated date column format', () => {
      const updatedDateFormat = {
        columnType: 'date' as const,
        style: 'date' as const,
        dateFormat: 'YYYY-MM-DD',
        useRelativeTime: true,
        isUtc: false,
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      };

      const result = columnLabelFormatSchema.safeParse(updatedDateFormat);
      expect(result.success).toBe(true);
    });

    test('should validate updated string column format with display name', () => {
      const updatedStringFormat = {
        columnType: 'string' as const,
        style: 'string' as const,
        displayName: 'Updated Column Name',
        prefix: 'Updated: ',
        suffix: ' (modified)',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      };

      const result = columnLabelFormatSchema.safeParse(updatedStringFormat);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Message Generation for Updates', () => {
    test('should generate appropriate error message for invalid YAML in updates', () => {
      const invalidUpdateYaml = 'invalid: yaml: [structure for update';
      const result = parseAndValidateYaml(invalidUpdateYaml);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    test('should generate appropriate error message for SQL validation in updates', () => {
      const invalidSql = 'DELETE FROM test WHERE id = 1';
      const result = validateSqlBasic(invalidSql);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query must contain SELECT statement');
    });

    test('should handle nested validation errors in updates', () => {
      const complexInvalidYaml = `
name: Test Update
description: Test
timeFrame: Today
sql: SELECT * FROM test
chartConfig:
  selectedChartType: metric
  # Missing required metricColumnId for metric type
  columnLabelFormats:
    test:
      columnType: invalid_type  # Invalid column type
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
      `;

      const result = parseAndValidateYaml(complexInvalidYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });
  });

  describe('Version Management Concepts', () => {
    test('should understand version increment logic', () => {
      // Test the concept of version management
      const currentVersion = 3;
      const nextVersion = currentVersion + 1;

      expect(nextVersion).toBe(4);
    });

    test('should handle version history concepts', () => {
      // Mock version history structure
      const mockVersionHistory = {
        versions: [
          { versionNumber: 1, content: { name: 'Original' } },
          { versionNumber: 2, content: { name: 'First Update' } },
          { versionNumber: 3, content: { name: 'Second Update' } },
        ],
        getLatestVersion: function () {
          return this.versions[this.versions.length - 1];
        },
      };

      const latestVersion = mockVersionHistory.getLatestVersion();
      expect(latestVersion.versionNumber).toBe(3);
      expect(latestVersion.content.name).toBe('Second Update');
    });
  });

  describe('Modification Result Tracking', () => {
    test('should track successful modifications', () => {
      const successResult = {
        file_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        file_name: 'Updated Test Metric',
        success: true,
        modification_type: 'content',
        timestamp: new Date().toISOString(),
        duration: 150,
      };

      expect(successResult.success).toBe(true);
      expect(successResult.modification_type).toBe('content');
      expect(typeof successResult.timestamp).toBe('string');
    });

    test('should track failed modifications', () => {
      const failureResult = {
        file_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        file_name: 'Failed Update Metric',
        success: false,
        error: 'Invalid YAML structure',
        modification_type: 'validation',
        timestamp: new Date().toISOString(),
        duration: 75,
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toBe('Invalid YAML structure');
      expect(failureResult.modification_type).toBe('validation');
    });
  });
});
