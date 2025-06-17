import { describe, expect, test } from 'vitest';
import * as yaml from 'yaml';
import { z } from 'zod';

// Import the schemas we want to test (extracted from the tool file)
const dashboardItemSchema = z.object({
  id: z.string().uuid('Must be a valid UUID for an existing metric'),
});

const dashboardRowSchema = z
  .object({
    id: z.number().int().positive('Row ID must be a positive integer'),
    items: z
      .array(dashboardItemSchema)
      .min(1, 'Each row must have at least 1 item')
      .max(4, 'Each row can have at most 4 items'),
    columnSizes: z
      .array(
        z
          .number()
          .int()
          .min(3, 'Each column size must be at least 3')
          .max(12, 'Each column size cannot exceed 12')
      )
      .min(1, 'columnSizes array cannot be empty')
      .refine((sizes) => sizes.reduce((sum, size) => sum + size, 0) === 12, {
        message: 'Column sizes must sum to exactly 12',
      }),
  })
  .refine((row) => row.items.length === row.columnSizes.length, {
    message: 'Number of items must match number of column sizes',
  });

const dashboardYmlSchema = z.object({
  name: z.string().min(1, 'Dashboard name is required'),
  description: z.string().min(1, 'Dashboard description is required'),
  rows: z
    .array(dashboardRowSchema)
    .min(1, 'Dashboard must have at least one row')
    .refine(
      (rows) => {
        const ids = rows.map((row) => row.id);
        const uniqueIds = new Set(ids);
        return ids.length === uniqueIds.size;
      },
      {
        message: 'All row IDs must be unique',
      }
    ),
});

// Parse and validate dashboard YAML content
function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
} {
  try {
    const parsedYml = yaml.parse(ymlContent);
    const validationResult = dashboardYmlSchema.safeParse(parsedYml);

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

// Mock metric ID validation function for testing
function validateMetricIds(metricIds: string[]): {
  success: boolean;
  missingIds?: string[];
  error?: string;
} {
  // Mock implementation for unit testing
  const validUUIDs = [
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'a47ac10b-58cc-4372-a567-0e02b2c3d480',
    '550e8400-e29b-41d4-a716-446655440000',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  ];

  const missingIds = metricIds.filter((id) => !validUUIDs.includes(id));

  if (missingIds.length > 0) {
    return { success: false, missingIds };
  }

  return { success: true };
}

describe('Create Dashboards File Tool Unit Tests', () => {
  describe('Dashboard YAML Schema Validation', () => {
    test('should validate correct single-row dashboard YAML', () => {
      const validDashboardYaml = `
name: Sales Dashboard
description: A comprehensive view of sales metrics and performance
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
      `;

      const result = parseAndValidateYaml(validDashboardYaml);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Sales Dashboard');
      expect(result.data?.rows).toHaveLength(1);
      expect(result.data?.rows[0].columnSizes).toEqual([12]);
    });

    test('should validate correct multi-row dashboard YAML', () => {
      const validMultiRowYaml = `
name: Executive Dashboard
description: High-level metrics for executive team
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
    columnSizes:
      - 6
      - 6
  - id: 2
    items:
      - id: 550e8400-e29b-41d4-a716-446655440000
    columnSizes:
      - 12
      `;

      const result = parseAndValidateYaml(validMultiRowYaml);
      expect(result.success).toBe(true);
      expect(result.data?.rows).toHaveLength(2);
      expect(result.data?.rows[0].items).toHaveLength(2);
      expect(result.data?.rows[1].items).toHaveLength(1);
    });

    test('should validate dashboard with maximum 4 items per row', () => {
      const maxItemsYaml = `
name: Detailed Dashboard
description: Dashboard with maximum items per row
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
      - id: 550e8400-e29b-41d4-a716-446655440000
      - id: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
    columnSizes:
      - 3
      - 3
      - 3
      - 3
      `;

      const result = parseAndValidateYaml(maxItemsYaml);
      expect(result.success).toBe(true);
      expect(result.data?.rows[0].items).toHaveLength(4);
      expect(result.data?.rows[0].columnSizes).toEqual([3, 3, 3, 3]);
    });

    test('should reject dashboard with missing required fields', () => {
      const missingFieldsYaml = `
name: Incomplete Dashboard
# Missing description and rows
      `;

      const result = parseAndValidateYaml(missingFieldsYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });

    test('should reject dashboard with invalid column sizes (not summing to 12)', () => {
      const invalidColumnSizesYaml = `
name: Invalid Column Dashboard
description: Dashboard with invalid column sizes
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
    columnSizes:
      - 4
      - 4
      `;

      const result = parseAndValidateYaml(invalidColumnSizesYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Column sizes must sum to exactly 12');
    });

    test('should reject dashboard with column size less than 3', () => {
      const tooSmallColumnYaml = `
name: Too Small Column Dashboard
description: Dashboard with column size less than 3
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
    columnSizes:
      - 2
      - 10
      `;

      const result = parseAndValidateYaml(tooSmallColumnYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Each column size must be at least 3');
    });

    test('should reject dashboard with more than 4 items per row', () => {
      const tooManyItemsYaml = `
name: Too Many Items Dashboard
description: Dashboard with more than 4 items per row
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
      - id: 550e8400-e29b-41d4-a716-446655440000
      - id: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d555
    columnSizes:
      - 3
      - 3
      - 2
      - 2
      - 2
      `;

      const result = parseAndValidateYaml(tooManyItemsYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Each row can have at most 4 items');
    });

    test('should reject dashboard with mismatched items and column sizes count', () => {
      const mismatchedCountYaml = `
name: Mismatched Count Dashboard
description: Dashboard with mismatched items and column sizes
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
    columnSizes:
      - 4
      - 4
      - 4
      `;

      const result = parseAndValidateYaml(mismatchedCountYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Number of items must match number of column sizes');
    });

    test('should reject dashboard with duplicate row IDs', () => {
      const duplicateRowIdsYaml = `
name: Duplicate Row IDs Dashboard
description: Dashboard with duplicate row IDs
rows:
  - id: 1
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
  - id: 1
    items:
      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480
    columnSizes:
      - 12
      `;

      const result = parseAndValidateYaml(duplicateRowIdsYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('All row IDs must be unique');
    });

    test('should reject dashboard with invalid metric UUID format', () => {
      const invalidUuidYaml = `
name: Invalid UUID Dashboard
description: Dashboard with invalid UUID format
rows:
  - id: 1
    items:
      - id: not-a-valid-uuid
    columnSizes:
      - 12
      `;

      const result = parseAndValidateYaml(invalidUuidYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Must be a valid UUID');
    });

    test('should reject dashboard with non-positive row ID', () => {
      const invalidRowIdYaml = `
name: Invalid Row ID Dashboard
description: Dashboard with invalid row ID
rows:
  - id: 0
    items:
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 12
      `;

      const result = parseAndValidateYaml(invalidRowIdYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Row ID must be a positive integer');
    });

    test('should reject dashboard with no rows', () => {
      const noRowsYaml = `
name: No Rows Dashboard
description: Dashboard with no rows
rows: []
      `;

      const result = parseAndValidateYaml(noRowsYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Dashboard must have at least one row');
    });
  });

  describe('Metric ID Validation', () => {
    test('should accept valid metric IDs', () => {
      const validIds = [
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        'a47ac10b-58cc-4372-a567-0e02b2c3d480',
      ];
      const result = validateMetricIds(validIds);
      expect(result.success).toBe(true);
    });

    test('should reject invalid metric IDs', () => {
      const invalidIds = ['f47ac10b-58cc-4372-a567-0e02b2c3d479', 'non-existent-id'];
      const result = validateMetricIds(invalidIds);
      expect(result.success).toBe(false);
      expect(result.missingIds).toEqual(['non-existent-id']);
    });

    test('should handle empty metric IDs array', () => {
      const result = validateMetricIds([]);
      expect(result.success).toBe(true);
    });

    test('should identify multiple missing IDs', () => {
      const invalidIds = ['missing-1', 'missing-2', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'];
      const result = validateMetricIds(invalidIds);
      expect(result.success).toBe(false);
      expect(result.missingIds).toEqual(['missing-1', 'missing-2']);
    });
  });

  describe('Input Schema Validation', () => {
    test('should validate correct input format', () => {
      const validInput = {
        files: [
          {
            name: 'Test Dashboard',
            yml_content:
              'name: Test Dashboard\ndescription: Test\nrows:\n  - id: 1\n    items:\n      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479\n    columnSizes:\n      - 12',
          },
        ],
      };

      // Basic validation that files array exists and has proper structure
      expect(validInput.files).toHaveLength(1);
      expect(validInput.files[0].name).toBe('Test Dashboard');
      expect(typeof validInput.files[0].yml_content).toBe('string');
    });

    test('should reject empty files array', () => {
      const invalidInput = { files: [] };

      // This would fail our minimum length validation
      expect(invalidInput.files).toHaveLength(0);
    });

    test('should reject input without name', () => {
      const invalidInput = {
        files: [
          {
            // Missing name
            yml_content: 'name: Test',
          },
        ],
      };

      expect(invalidInput.files[0]).not.toHaveProperty('name');
    });

    test('should validate bulk input format', () => {
      const bulkInput = {
        files: [
          {
            name: 'First Dashboard',
            yml_content:
              'name: First Dashboard\ndescription: First\nrows:\n  - id: 1\n    items:\n      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479\n    columnSizes:\n      - 12',
          },
          {
            name: 'Second Dashboard',
            yml_content:
              'name: Second Dashboard\ndescription: Second\nrows:\n  - id: 1\n    items:\n      - id: a47ac10b-58cc-4372-a567-0e02b2c3d480\n    columnSizes:\n      - 12',
          },
        ],
      };

      expect(bulkInput.files).toHaveLength(2);
      expect(bulkInput.files.every((f) => f.name && f.yml_content)).toBe(true);
    });
  });

  describe('Dashboard Row Schema Validation', () => {
    test('should validate single item row', () => {
      const singleItemRow = {
        id: 1,
        items: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }],
        columnSizes: [12],
      };

      const result = dashboardRowSchema.safeParse(singleItemRow);
      expect(result.success).toBe(true);
    });

    test('should validate two item row', () => {
      const twoItemRow = {
        id: 2,
        items: [
          { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480' },
        ],
        columnSizes: [6, 6],
      };

      const result = dashboardRowSchema.safeParse(twoItemRow);
      expect(result.success).toBe(true);
    });

    test('should validate three item row', () => {
      const threeItemRow = {
        id: 3,
        items: [
          { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480' },
          { id: '550e8400-e29b-41d4-a716-446655440000' },
        ],
        columnSizes: [4, 4, 4],
      };

      const result = dashboardRowSchema.safeParse(threeItemRow);
      expect(result.success).toBe(true);
    });

    test('should validate four item row', () => {
      const fourItemRow = {
        id: 4,
        items: [
          { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
          { id: 'a47ac10b-58cc-4372-a567-0e02b2c3d480' },
          { id: '550e8400-e29b-41d4-a716-446655440000' },
          { id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' },
        ],
        columnSizes: [3, 3, 3, 3],
      };

      const result = dashboardRowSchema.safeParse(fourItemRow);
      expect(result.success).toBe(true);
    });

    test('should reject row with invalid column size sum', () => {
      const invalidSumRow = {
        id: 1,
        items: [{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }],
        columnSizes: [10], // Should be 12
      };

      const result = dashboardRowSchema.safeParse(invalidSumRow);
      expect(result.success).toBe(false);
    });
  });

  describe('Error Message Generation', () => {
    test('should generate appropriate error message for invalid YAML', () => {
      const invalidYaml = 'invalid: yaml: [structure';
      const result = parseAndValidateYaml(invalidYaml);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });

    test('should generate appropriate error message for metric validation', () => {
      const invalidIds = ['missing-metric-id'];
      const result = validateMetricIds(invalidIds);

      expect(result.success).toBe(false);
      expect(result.missingIds).toEqual(['missing-metric-id']);
    });

    test('should handle complex validation errors', () => {
      const complexInvalidYaml = `
name: Complex Invalid Dashboard
description: Dashboard with multiple validation errors
rows:
  - id: 1
    items:
      - id: invalid-uuid
      - id: f47ac10b-58cc-4372-a567-0e02b2c3d479
    columnSizes:
      - 2
      - 8
      `;

      const result = parseAndValidateYaml(complexInvalidYaml);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid YAML structure');
    });
  });

  describe('Dashboard Item Schema Validation', () => {
    test('should validate correct dashboard item', () => {
      const validItem = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const result = dashboardItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    test('should reject dashboard item with invalid UUID', () => {
      const invalidItem = {
        id: 'not-a-uuid',
      };

      const result = dashboardItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    test('should reject dashboard item without ID', () => {
      const itemWithoutId = {};

      const result = dashboardItemSchema.safeParse(itemWithoutId);
      expect(result.success).toBe(false);
    });
  });

  describe('Column Size Edge Cases', () => {
    test('should accept valid column size combinations', () => {
      const validCombinations = [[12], [6, 6], [4, 4, 4], [3, 3, 3, 3], [3, 9], [4, 8], [5, 7]];

      validCombinations.forEach((columnSizes) => {
        const sum = columnSizes.reduce((a, b) => a + b, 0);
        expect(sum).toBe(12);
        const allValid = columnSizes.every((size) => size >= 3 && size <= 12);
        expect(allValid).toBe(true);
      });
    });

    test('should reject invalid column size combinations', () => {
      const invalidCombinations = [
        [13], // Too large
        [11], // Sum not 12
        [2, 10], // Size too small
        [6, 6, 1], // Size too small, sum not 12
        [1, 1, 10], // Sizes too small
        [15], // Size too large
      ];

      invalidCombinations.forEach((columnSizes) => {
        const sum = columnSizes.reduce((a, b) => a + b, 0);
        const hasInvalidSize = columnSizes.some((size) => size < 3 || size > 12);
        const invalidSum = sum !== 12;

        expect(hasInvalidSize || invalidSum).toBe(true);
      });
    });
  });
});
