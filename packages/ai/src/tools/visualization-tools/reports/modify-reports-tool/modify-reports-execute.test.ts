import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyReportsExecute } from './modify-reports-execute';
import type {
  ModifyReportsContext,
  ModifyReportsInput,
  ModifyReportsState,
} from './modify-reports-tool';

// Mock dependencies
const mockDbLimit = vi.fn();
const mockDbWhere = vi.fn();
const mockDbFrom = vi.fn();
const mockDbSelect = vi.fn();

vi.mock('@buster/database/queries', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
  updateReportWithVersion: vi.fn().mockResolvedValue(undefined),
  updateMetricsToReports: vi.fn().mockResolvedValue({ created: 0, updated: 0, deleted: 0 }),
  waitForPendingReportUpdates: vi.fn().mockResolvedValue(undefined),
  closeReportUpdateQueue: vi.fn(),
}));
vi.mock('@buster/database/schema', () => ({
  reportFiles: {},
}));
vi.mock('@buster/database/connection', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              content: '# Original Report\nSome content here.',
              versionHistory: null,
            },
          ]),
        }),
      }),
    }),
  },
}));

vi.mock('../helpers/report-version-helper', () => ({
  shouldIncrementVersion: vi.fn().mockResolvedValue(true),
  updateVersionHistory: vi.fn().mockReturnValue({
    versionHistory: {},
    newVersionNumber: 2,
  }),
}));

vi.mock('../../file-tracking-helper', () => ({
  trackFileAssociations: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('./helpers/modify-reports-transform-helper', () => ({
  createModifyReportsRawLlmMessageEntry: vi.fn().mockReturnValue({
    id: 'raw-llm-1',
    type: 'raw-llm',
    content: 'raw llm content',
  }),
  createModifyReportsReasoningEntry: vi.fn().mockReturnValue({
    id: 'reasoning-1',
    type: 'reasoning',
    content: 'reasoning content',
  }),
}));

vi.mock('../../../shared/create-raw-llm-tool-result-entry', () => ({
  createRawToolResultEntry: vi.fn().mockReturnValue({
    id: 'result-1',
    type: 'tool-result',
    content: 'result content',
  }),
}));

vi.mock('../helpers/metric-extraction', () => ({
  extractAndCacheMetricsWithUserContext: vi.fn().mockResolvedValue(undefined),
  extractMetricIds: vi.fn().mockReturnValue([]),
}));

vi.mock('../report-snapshot-cache', () => ({
  getCachedSnapshot: vi.fn().mockReturnValue(null),
  updateCachedSnapshot: vi.fn().mockResolvedValue(undefined),
}));

import { db } from '@buster/database/connection';
import { updateMessageEntries } from '@buster/database/queries';

describe('modify-reports-execute', () => {
  let context: ModifyReportsContext;
  let state: ModifyReportsState;
  let mockUpdateMessageEntries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDbLimit.mockClear();
    mockUpdateMessageEntries = updateMessageEntries as ReturnType<typeof vi.fn>;

    context = {
      userId: 'user-123',
      chatId: 'chat-456',
      organizationId: 'org-789',
      messageId: 'msg-001',
    };

    state = {
      toolCallId: 'tool-call-123',
      edits: [],
      startTime: Date.now(),
      snapshotContent: undefined, // Will be set per test
      versionHistory: undefined, // Will be set per test
    };
  });

  describe('responseMessages conditional logic', () => {
    it('should add report to responseMessages when modified report contains metrics', async () => {
      // Mock existing report in database
      const existingReportContent = '# Original Report\nSome content here.';
      const modifiedContent = `# Modified Report
<metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
Updated content with metrics.`;

      mockDbLimit.mockResolvedValue([
        {
          content: existingReportContent,
          versionHistory: null,
        },
      ]);

      // Setup state with snapshot
      state.snapshotContent = existingReportContent;
      state.edits = [
        {
          code_to_replace: '# Original Report\nSome content here.',
          code: modifiedContent,
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-123',
        name: 'Modified Sales Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: '# Original Report\nSome content here.',
            code: modifiedContent,
          },
        ],
      };

      // Mock that the modified report contains metrics

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Check result
      expect(result.success).toBe(true);
      expect(result.file.content).toBe(modifiedContent);

      // Check that updateMessageEntries was called with responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];

      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages).toHaveLength(1);
      expect(updateCall.responseMessages[0]).toMatchObject({
        id: 'report-123',
        type: 'file',
        file_type: 'report_file',
        file_name: 'Modified Sales Report',
      });
    });

    it('should add all successfully modified reports to responseMessages', async () => {
      // Mock existing report in database
      const existingReportContent = '# Original Report\nSome content here.';
      const modifiedContent = '# Modified Report\nUpdated content without any metrics.';

      mockDbLimit.mockResolvedValue([
        {
          content: existingReportContent,
          versionHistory: null,
        },
      ]);

      state.edits = [
        {
          code_to_replace: '# Original Report\nSome content here.',
          code: modifiedContent,
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-123',
        name: 'Modified Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: '# Original Report\nSome content here.',
            code: modifiedContent,
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Check result
      expect(result.success).toBe(true);

      // Check that updateMessageEntries was called WITH responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];

      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages).toHaveLength(1);
      expect(updateCall.responseMessages?.[0]).toMatchObject({
        id: 'report-123',
        type: 'file',
        file_type: 'report_file',
        file_name: 'Modified Report',
        version_number: 2,
      });
    });

    it('should check metrics on final content after all edits are applied', async () => {
      // Mock existing report
      const originalContent = '# Report\nSection 1\nSection 2\nSection 3';

      mockDbLimit.mockResolvedValue([
        {
          content: originalContent,
          versionHistory: null,
        },
      ]);

      // Multiple edits that eventually add a metric
      state.snapshotContent = originalContent;
      state.edits = [
        {
          code_to_replace: 'Section 1',
          code: 'Updated Section 1',
          status: 'loading',
          operation: 'replace',
        },
        {
          code_to_replace: 'Section 2',
          code: 'Section 2 with <metric metricId="uuid-123" />',
          status: 'loading',
          operation: 'replace',
        },
        {
          code_to_replace: 'Section 3',
          code: 'Updated Section 3',
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-456',
        name: 'Multi-Edit Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: 'Section 1',
            code: 'Updated Section 1',
          },
          {
            operation: 'replace' as const,
            code_to_replace: 'Section 2',
            code: 'Section 2 with <metric metricId="uuid-123" />',
          },
          {
            operation: 'replace' as const,
            code_to_replace: 'Section 3',
            code: 'Updated Section 3',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      expect(result.success).toBe(true);

      // Response messages should be created for all successfully modified reports

      // Should add to responseMessages since final content has metrics
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages).toHaveLength(1);
    });

    it('should handle failed edits and not add to responseMessages', async () => {
      // Mock existing report
      mockDbLimit.mockResolvedValue([
        {
          content: '# Original Report',
          versionHistory: null,
        },
      ]);

      state.edits = [
        {
          code_to_replace: 'Non-existent text',
          code: '<metric metricId="uuid-123" />',
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-789',
        name: 'Failed Edit Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: 'Non-existent text',
            code: '<metric metricId="uuid-123" />',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Should fail because text to replace doesn't exist
      expect(result.success).toBe(false);
      expect(result.error).toContain('Text not found');

      // Should still update message entries, but no responseMessages for failed edits
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(updateCall.responseMessages).toBeUndefined();
    });

    it('should handle missing messageId in context', async () => {
      // Remove messageId from context
      context.messageId = undefined;

      // Setup state with snapshot
      state.snapshotContent = 'Original';

      mockDbLimit.mockResolvedValue([
        {
          content: 'Original',
          versionHistory: null,
        },
      ]);

      const input: ModifyReportsInput = {
        id: 'report-999',
        name: 'No Message ID Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: 'Original',
            code: 'Modified with <metric metricId="uuid-123" />',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Should complete successfully
      expect(result.success).toBe(true);

      // Should not call updateMessageEntries without messageId
      expect(mockUpdateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle report not found in database', async () => {
      // Override the database mock for this specific test to return empty array
      const mockDbSelect = vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      (db.select as ReturnType<typeof vi.fn>) = mockDbSelect;

      // Mock no report found - snapshot will be undefined since report doesn't exist
      // This should trigger the fallback to fetch from DB
      state.snapshotContent = undefined;

      const input: ModifyReportsInput = {
        id: 'non-existent-report',
        name: 'Ghost Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: 'something',
            code: 'something else',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Report not found');

      // Should still try to update message entries with failure status
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(updateCall.responseMessages).toBeUndefined();
    });

    it('should wait for lastUpdate promise before executing final write', async () => {
      // This test validates the fix for the race condition where delta writes
      // could complete out of order, causing data inconsistency

      // Create a delayed promise to simulate an in-progress delta write
      let resolveLastUpdate: () => void;
      const lastUpdatePromise = new Promise<void>((resolve) => {
        resolveLastUpdate = resolve;
      });

      // Set up state with an in-progress lastProcessing
      state.lastProcessing = lastUpdatePromise;
      state.snapshotContent = '# Original Report';

      mockDbLimit.mockResolvedValue([
        {
          content: '# Original Report',
          versionHistory: null,
        },
      ]);

      const input: ModifyReportsInput = {
        id: 'report-concurrent',
        name: 'Concurrent Write Test',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: '# Original Report',
            code: '# Final Version',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);

      // Start the execute (it should wait for lastProcessing)
      const executePromise = execute(input);

      // Give it a moment to ensure it's waiting
      await new Promise((resolve) => setTimeout(resolve, 10));

      // updateReportWithVersion should not have been called yet
      const mockUpdateReportWithVersion = vi.mocked(
        await import('@buster/database/queries').then((m) => m.updateReportWithVersion)
      );
      expect(mockUpdateReportWithVersion).not.toHaveBeenCalled();

      // Now resolve the lastProcessing promise
      resolveLastUpdate!();

      // Wait for execute to complete
      const result = await executePromise;

      // Now updateReportWithVersion should have been called
      expect(mockUpdateReportWithVersion).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.file.content).toContain('# Final Version');
    });

    it('should handle lastUpdate promise rejection gracefully', async () => {
      // Create a rejected promise to simulate a failed delta write
      const lastUpdatePromise = Promise.reject(new Error('Delta write failed'));

      // Set up state with a rejected lastProcessing
      state.lastProcessing = lastUpdatePromise;
      state.snapshotContent = '# Original Report';

      mockDbLimit.mockResolvedValue([
        {
          content: '# Original Report',
          versionHistory: null,
        },
      ]);

      const input: ModifyReportsInput = {
        id: 'report-error-handling',
        name: 'Error Handling Test',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: '# Original Report',
            code: '# Updated Report',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);

      // Execute should still complete successfully despite the failed lastUpdate
      const result = await execute(input);

      expect(result.success).toBe(true);
      expect(result.file.content).toContain('# Updated Report');

      // Should log a warning about the failed delta write
      // (In a real test, you might spy on console.warn)
    });

    it('should only check metrics on successful modifications', async () => {
      // Setup two reports - one success, one failure
      mockDbLimit
        .mockResolvedValueOnce([
          {
            content: 'Original Content',
            versionHistory: null,
          },
        ])
        .mockResolvedValueOnce([]); // Second report not found

      // First execution - successful
      const input1: ModifyReportsInput = {
        id: 'success-report',
        name: 'Success Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: 'Original Content',
            code: 'Modified with <metric metricId="uuid-1" />',
          },
        ],
      };

      // Set snapshot for first execution
      const state1 = { ...state, snapshotContent: 'Original Content' };
      const execute1 = createModifyReportsExecute(context, state1);
      const result1 = await execute1(input1);

      expect(result1.success).toBe(true);
      // Response message should be created for successful modification

      // Reset mocks for second execution
      vi.clearAllMocks();

      // Second execution - failure (report not found)
      const input2: ModifyReportsInput = {
        id: 'missing-report',
        name: 'Missing Report',
        edits: [
          {
            operation: 'replace' as const,
            code_to_replace: 'anything',
            code: 'anything with <metric metricId="uuid-2" />',
          },
        ],
      };

      // No snapshot for missing report - should trigger fallback
      const state2 = { ...state, snapshotContent: undefined };
      const execute2 = createModifyReportsExecute(context, state2);
      const result2 = await execute2(input2);

      expect(result2.success).toBe(false);
      // No response messages should be created when modification fails
    });
  });
});
