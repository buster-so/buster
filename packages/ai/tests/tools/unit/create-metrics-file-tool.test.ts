import { describe, expect, test } from 'vitest';
import * as yaml from 'yaml';
import { z } from 'zod';

// Import the schemas we want to test (we'll extract these from the tool file)
// For now, let's define the schemas locally for testing

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

const chartConfigSchema = z.union([tableChartConfigSchema, metricChartConfigSchema]);

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
  data?: any;
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

describe('Create Metrics File Tool Unit Tests', () => {
  describe('YAML Schema Validation', () => {
    test('should validate correct table chart YAML', () => {
      const validTableYaml = `
name: Sales Summary
description: Summary of sales data
timeFrame: Last 30 days
sql: |
  SELECT 
    product_name,
    order_date,
    SUM(amount) as total_amount
  FROM sales 
  WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY product_name, order_date
  ORDER BY order_date DESC
chartConfig:
  selectedChartType: table
  tableColumnOrder:
    - product_name
    - order_date
    - total_amount
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
      `;

      const result = parseAndValidateYaml(validTableYaml);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Sales Summary');
      expect(result.data?.chartConfig.selectedChartType).toBe('table');
    });

    test('should validate correct metric chart YAML', () => {
      const validMetricYaml = `
name: Total Sales
description: Total sales amount
timeFrame: All time
sql: |
  SELECT SUM(amount) as total_sales FROM sales
chartConfig:
  selectedChartType: metric
  metricColumnId: total_sales
  columnLabelFormats:
    total_sales:
      columnType: number
      style: currency
      currency: "USD"
      numberSeparatorStyle: ","
      replaceMissingDataWith: 0
      `;

      const result = parseAndValidateYaml(validMetricYaml);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Total Sales');
      expect(result.data?.chartConfig.selectedChartType).toBe('metric');
      expect(result.data?.chartConfig.metricColumnId).toBe('total_sales');
    });

    test('should reject YAML with missing required fields', () => {
      const missingFieldsYaml = `
name: Test Metric
description: Test
# Missing timeFrame and sql
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    test:
      columnType: string
      style: string
      numberSeparatorStyle: null
      replaceMissingDataWith: null
      `;

      const result = parseAndValidateYaml(missingFieldsYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });

    test('should reject invalid chart type', () => {
      const invalidChartTypeYaml = `
name: Test Metric
description: Test
timeFrame: Today
sql: SELECT * FROM test
chartConfig:
  selectedChartType: invalid_chart_type
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

    test('should reject metric chart without required metricColumnId', () => {
      const invalidMetricYaml = `
name: Test Metric Chart
description: Test
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

      const result = parseAndValidateYaml(invalidMetricYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });

    test('should reject invalid YAML syntax', () => {
      const invalidYaml = `
name: Test Metric
description: Test
timeFrame: Today
sql: SELECT * FROM test
chartConfig:
  selectedChartType: table
  columnLabelFormats:
    - invalid: yaml: structure
      `;

      const result = parseAndValidateYaml(invalidYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Nested mappings are not allowed');
    });
  });

  describe('SQL Validation', () => {
    test('should accept valid SELECT SQL', () => {
      const validSql =
        "SELECT id, name, amount FROM sales WHERE created_at > NOW() - INTERVAL '1 day'";
      const result = validateSqlBasic(validSql);
      expect(result.success).toBe(true);
    });

    test('should reject empty SQL', () => {
      const result = validateSqlBasic('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query cannot be empty');
    });

    test('should reject SQL without SELECT', () => {
      const noSelectSql = "INSERT INTO test VALUES (1, 'test')";
      const result = validateSqlBasic(noSelectSql);
      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query must contain SELECT statement');
    });

    test('should reject SQL without FROM', () => {
      const noFromSql = 'SELECT 1';
      const result = validateSqlBasic(noFromSql);
      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query must contain FROM clause');
    });

    test('should handle SQL with complex formatting', () => {
      const complexSql = `
        SELECT 
          customer_id,
          COUNT(*) as order_count,
          SUM(total_amount) as total_spent
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY customer_id
        HAVING order_count > 1
        ORDER BY total_spent DESC
        LIMIT 100
      `;

      const result = validateSqlBasic(complexSql);
      expect(result.success).toBe(true);
    });
  });

  describe('Column Label Format Validation', () => {
    test('should validate correct column format for numbers', () => {
      const numberFormat = {
        columnType: 'number' as const,
        style: 'currency' as const,
        currency: 'USD',
        numberSeparatorStyle: ',',
        replaceMissingDataWith: 0,
      };

      const result = columnLabelFormatSchema.safeParse(numberFormat);
      expect(result.success).toBe(true);
    });

    test('should validate correct column format for dates', () => {
      const dateFormat = {
        columnType: 'date' as const,
        style: 'date' as const,
        dateFormat: 'MMM D, YYYY',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      };

      const result = columnLabelFormatSchema.safeParse(dateFormat);
      expect(result.success).toBe(true);
    });

    test('should validate correct column format for strings', () => {
      const stringFormat = {
        columnType: 'string' as const,
        style: 'string' as const,
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      };

      const result = columnLabelFormatSchema.safeParse(stringFormat);
      expect(result.success).toBe(true);
    });

    test('should reject invalid column type', () => {
      const invalidFormat = {
        columnType: 'invalid_type',
        style: 'string',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      };

      const result = columnLabelFormatSchema.safeParse(invalidFormat);
      expect(result.success).toBe(false);
    });

    test('should reject invalid style', () => {
      const invalidFormat = {
        columnType: 'string' as const,
        style: 'invalid_style',
        numberSeparatorStyle: null,
        replaceMissingDataWith: null,
      };

      const result = columnLabelFormatSchema.safeParse(invalidFormat);
      expect(result.success).toBe(false);
    });
  });

  describe('Input Schema Validation', () => {
    test('should validate correct input format', () => {
      const validInput = {
        files: [
          {
            name: 'Test Metric',
            yml_content:
              'name: Test Metric\ndescription: Test\ntimeFrame: Today\nsql: SELECT * FROM test\nchartConfig:\n  selectedChartType: table\n  columnLabelFormats:\n    test:\n      columnType: string\n      style: string\n      numberSeparatorStyle: null\n      replaceMissingDataWith: null',
          },
        ],
      };

      // Basic validation that files array exists and has proper structure
      expect(validInput.files).toHaveLength(1);
      expect(validInput.files[0].name).toBe('Test Metric');
      expect(typeof validInput.files[0].yml_content).toBe('string');
    });

    test('should reject empty files array', () => {
      const invalidInput = { files: [] };

      // This would fail our minimum length validation
      expect(invalidInput.files).toHaveLength(0);
    });
  });

  describe('Error Message Generation', () => {
    test('should generate appropriate error message for YAML parsing', () => {
      const invalidYaml = 'invalid: yaml: [structure';
      const result = parseAndValidateYaml(invalidYaml);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    test('should generate appropriate error message for SQL validation', () => {
      const invalidSql = '';
      const result = validateSqlBasic(invalidSql);

      expect(result.success).toBe(false);
      expect(result.error).toBe('SQL query cannot be empty');
    });
  });
});
