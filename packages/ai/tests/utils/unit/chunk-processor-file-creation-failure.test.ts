import { describe, expect, test } from 'vitest';
import { determineToolStatus, isErrorResult } from '../../../src/utils/database/types';

describe('ChunkProcessor - File Creation Tool Failure Detection', () => {
  describe('isErrorResult with file creation tool patterns', () => {
    test('should detect failure from message field containing error keywords', () => {
      const toolResult = {
        files: [],
        message: "Failed to create 'Top Customer by Revenue': Connection terminated unexpectedly",
        duration: 168,
        failed_files: [
          {
            name: 'Top Customer by Revenue',
            error: 'Connection terminated unexpectedly',
          },
        ],
      };

      expect(isErrorResult(toolResult)).toBe(true);
      expect(determineToolStatus(toolResult)).toBe('failed');
    });

    test('should detect failure from failed_files array', () => {
      const toolResult = {
        files: [],
        failed_files: [
          {
            name: 'Metric 1',
            error: 'Validation error',
          },
          {
            name: 'Metric 2',
            error: 'Schema error',
          },
        ],
      };

      expect(isErrorResult(toolResult)).toBe(true);
      expect(determineToolStatus(toolResult)).toBe('failed');
    });

    test('should detect failure from empty files array with error message', () => {
      const toolResult = {
        files: [],
        message: 'An error occurred while creating the metrics',
      };

      expect(isErrorResult(toolResult)).toBe(true);
      expect(determineToolStatus(toolResult)).toBe('failed');
    });

    test('should not detect failure for successful results', () => {
      const successResult = {
        files: [
          {
            id: 'file-1',
            name: 'Success Metric',
          },
        ],
        message: 'Successfully created 1 metric',
      };

      expect(isErrorResult(successResult)).toBe(false);
      expect(determineToolStatus(successResult)).toBe('completed');
    });

    test('should handle partial failures correctly', () => {
      const partialResult = {
        files: [
          {
            id: 'file-1',
            name: 'Success Metric',
          },
        ],
        message: 'Created 1 metric, 1 failed',
        failed_files: [
          {
            name: 'Failed Metric',
            error: 'Validation error',
          },
        ],
      };

      // Should be detected as error because of failed_files
      expect(isErrorResult(partialResult)).toBe(true);
      expect(determineToolStatus(partialResult)).toBe('failed');
    });

    test('should handle various error message patterns', () => {
      const errorPatterns = [
        'Failed to create metric',
        'Error creating dashboard',
        'Exception thrown during file creation',
        'Creation failed with error',
        'Unable to create files due to error',
      ];

      for (const message of errorPatterns) {
        const result = {
          files: [],
          message,
        };
        expect(isErrorResult(result)).toBe(true);
        expect(determineToolStatus(result)).toBe('failed');
      }
    });

    test('should not falsely detect errors in success messages', () => {
      const successPatterns = [
        'Successfully created all metrics',
        'Metrics created without issues',
        'Dashboard creation completed',
        'All files processed successfully',
      ];

      for (const message of successPatterns) {
        const result = {
          files: [{ id: 'test', name: 'test.yml' }],
          message,
        };
        expect(isErrorResult(result)).toBe(false);
        expect(determineToolStatus(result)).toBe('completed');
      }
    });

    test('should handle edge cases', () => {
      // Empty files array without message or failed_files
      expect(
        isErrorResult({
          files: [],
        })
      ).toBe(false);

      // Empty failed_files array
      expect(
        isErrorResult({
          files: [],
          failed_files: [],
        })
      ).toBe(false);

      // Non-array failed_files
      expect(
        isErrorResult({
          files: [],
          failed_files: 'not an array',
        })
      ).toBe(false);
    });
  });

  describe('Real-world file creation tool failure scenarios', () => {
    test('createMetrics tool complete failure', () => {
      const createMetricsFailure = {
        files: [],
        message:
          "Failed to create 'Top Customer by Revenue': The SQL query has an issue: Failed to create adapter for 'datasource-14d50bf5-6dee-42a7-bdff-a4a398156edf': Failed to initialize PostgreSQL client: Connection terminated unexpectedly. Please check your query syntax.",
        duration: 168,
        failed_files: [
          {
            name: 'Top Customer by Revenue',
            error:
              "The SQL query has an issue: Failed to create adapter for 'datasource-14d50bf5-6dee-42a7-bdff-a4a398156edf': Failed to initialize PostgreSQL client: Connection terminated unexpectedly. Please check your query syntax.",
          },
        ],
      };

      expect(isErrorResult(createMetricsFailure)).toBe(true);
      expect(determineToolStatus(createMetricsFailure)).toBe('failed');
    });

    test('createDashboards tool partial failure', () => {
      const createDashboardsPartialFailure = {
        files: [
          {
            id: 'dash-1',
            name: 'Revenue Dashboard',
          },
        ],
        message: 'Created 1 dashboard, 2 failed due to validation errors',
        duration: 250,
        failed_files: [
          {
            name: 'Customer Dashboard',
            error: 'Invalid metric reference: customer_count',
          },
          {
            name: 'Sales Dashboard',
            error: 'Missing required field: timeFrame',
          },
        ],
      };

      expect(isErrorResult(createDashboardsPartialFailure)).toBe(true);
      expect(determineToolStatus(createDashboardsPartialFailure)).toBe('failed');
    });

    test('modifyMetrics tool failure', () => {
      const modifyMetricsFailure = {
        files: [],
        message: 'Failed to modify metrics: Database connection lost',
        failed_files: [
          {
            name: 'Revenue Metric',
            id: 'metric-123',
            error: 'Connection lost during update',
          },
        ],
      };

      expect(isErrorResult(modifyMetricsFailure)).toBe(true);
      expect(determineToolStatus(modifyMetricsFailure)).toBe('failed');
    });
  });
});
