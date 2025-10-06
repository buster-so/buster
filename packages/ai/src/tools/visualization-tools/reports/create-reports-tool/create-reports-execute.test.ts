import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateReportsExecute } from './create-reports-execute';
import type {
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsState,
} from './create-reports-tool';

// Mock dependencies
vi.mock('@buster/database/queries', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
  updateReportWithVersion: vi.fn().mockResolvedValue(undefined),
  updateMetricsToReports: vi.fn().mockResolvedValue({ created: 0, updated: 0, deleted: 0 }),
  closeReportUpdateQueue: vi.fn(),
  waitForPendingReportUpdates: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./helpers/create-reports-tool-transform-helper', () => ({
  createCreateReportsRawLlmMessageEntry: vi.fn().mockReturnValue({
    id: 'raw-llm-1',
    type: 'raw-llm',
    content: 'raw llm content',
  }),
  createCreateReportsReasoningEntry: vi.fn().mockReturnValue({
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

vi.mock('../../../shared/cleanup-state', () => ({
  cleanupState: vi.fn(),
}));

vi.mock('../../file-tracking-helper', () => ({
  trackFileAssociations: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../helpers/metric-extraction', () => ({
  extractAndCacheMetricsWithUserContext: vi.fn().mockResolvedValue(undefined),
  extractMetricIds: vi.fn().mockReturnValue([]),
}));

vi.mock('../report-snapshot-cache', () => ({
  updateCachedSnapshot: vi.fn(),
}));

import { updateMessageEntries } from '@buster/database/queries';

describe('create-reports-execute', () => {
  let context: CreateReportsContext;
  let state: CreateReportsState;
  let mockUpdateMessageEntries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateMessageEntries = updateMessageEntries as ReturnType<typeof vi.fn>;

    context = {
      userId: 'user-123',
      chatId: 'chat-456',
      organizationId: 'org-789',
      messageId: 'msg-001',
    };

    state = {
      toolCallId: 'tool-call-123',
      file: undefined,
      startTime: Date.now(),
    };
  });

  describe('responseMessages creation', () => {
    it('should add report to responseMessages', async () => {
      // Setup state with a successful report
      state.file = {
        id: 'report-1',
        file_name: 'Sales Report Q4',
        file_type: 'report_file',
        version_number: 1,
        status: 'completed',
      };

      const input: CreateReportsInput = {
        name: 'Sales Report Q4',
        content: `
          # Sales Report Q4
          <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
          Sales increased by 25%.
        `,
      };

      // Mock that the report contains metrics

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Check that updateMessageEntries was called with responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      // Get the last call (final entries) which should have responseMessages
      const lastCallIndex = mockUpdateMessageEntries.mock.calls.length - 1;
      const updateCall = mockUpdateMessageEntries.mock.calls[lastCallIndex]?.[0];

      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages?.length).toBe(1);
      expect(updateCall.responseMessages?.[0]).toMatchObject({
        id: 'report-1',
        type: 'file',
        file_type: 'report_file',
        file_name: 'Sales Report Q4',
        version_number: 1,
      });
    });

    it('should add reports without metrics to responseMessages', async () => {
      // Setup state with a successful report
      state.file = {
        id: 'report-2',
        file_name: 'Simple Report',
        file_type: 'report_file',
        version_number: 1,
        status: 'completed',
      };

      const input: CreateReportsInput = {
        name: 'Simple Report',
        content: `
          # Simple Report
          This report has no metrics, just text analysis.
        `,
      };

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Check that updateMessageEntries was called WITH responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      // Get the last call (final entries) which should have responseMessages
      const lastCallIndex = mockUpdateMessageEntries.mock.calls.length - 1;
      const updateCall = mockUpdateMessageEntries.mock.calls[lastCallIndex]?.[0];

      expect(updateCall?.responseMessages).toBeDefined();
      expect(updateCall?.responseMessages).toHaveLength(1);
      expect(updateCall?.responseMessages?.[0]).toMatchObject({
        id: 'report-2',
        type: 'file',
        file_type: 'report_file',
        file_name: 'Simple Report',
        version_number: 1,
      });
    });

    it('should create initial entries on first execution', async () => {
      state.initialEntriesCreated = false;
      state.file = undefined;

      const input: CreateReportsInput = {
        name: 'Test Report',
        content: 'Test content',
      };

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Should be called twice - once for initial entries, once for final
      expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);

      // First call should be initial entries
      const firstCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(firstCall.messageId).toBe('msg-001');
      expect(firstCall.reasoningMessages).toBeDefined();
      // rawLlmMessages are intentionally not created in initial entries to avoid duplicates

      // State should be updated
      expect(state.initialEntriesCreated).toBe(true);
    });

    it('should not create initial entries if already created', async () => {
      state.initialEntriesCreated = true;
      state.file = {
        id: 'report-1',
        file_name: 'Test Report',
        file_type: 'report_file',
        version_number: 1,
        status: 'completed',
      };

      const input: CreateReportsInput = {
        name: 'Test Report',
        content: '<metric metricId="uuid-1" />',
      };

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Should only be called once for final entries
      expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);
    });

    it('should handle report with failed status', async () => {
      // Simulate a scenario where report creation failed during delta
      state.file = {
        id: '', // No ID means report creation failed during delta
        file_name: 'Failed Report',
        file_type: 'report_file',
        version_number: 1,
        status: 'failed',
        error: 'Report creation failed during streaming',
      };

      const input: CreateReportsInput = {
        name: 'Failed Report',
        content: '<metric metricId="uuid-2" />',
      };

      const execute = createCreateReportsExecute(context, state);
      const result = await execute(input);

      // Result should show failure
      expect(result.file).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Report creation failed during streaming');

      // No responseMessages should be created for failed report
      // Get the last call (final entries)
      const lastCallIndex = mockUpdateMessageEntries.mock.calls.length - 1;
      const updateCall = mockUpdateMessageEntries.mock.calls[lastCallIndex]?.[0];
      expect(updateCall?.responseMessages).toBeUndefined();
    });

    it('should handle missing messageId in context', async () => {
      // Remove messageId from context
      context.messageId = undefined;

      state.file = {
        id: 'report-1',
        file_name: 'Test Report',
        file_type: 'report_file',
        version_number: 1,
        status: 'completed',
      };

      const input: CreateReportsInput = {
        name: 'Test Report',
        content: '<metric metricId="uuid-1" />',
      };

      const execute = createCreateReportsExecute(context, state);
      const result = await execute(input);

      // Should complete successfully but not call updateMessageEntries
      expect(result.file).toBeDefined();
      expect(mockUpdateMessageEntries).not.toHaveBeenCalled();
    });
  });
});
