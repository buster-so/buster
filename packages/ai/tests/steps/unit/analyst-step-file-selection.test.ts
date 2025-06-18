import { describe, expect, test } from 'vitest';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../../server/src/types/chat-types/chat-message.type';
import { hasFailureIndicators, hasFileFailureIndicators } from '../../../src/utils/database/types';

// Import the functions we want to test (we'll need to export them from analyst-step.ts)
// For now, I'll copy them here for testing
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  ymlContent?: string;
}

function extractFilesFromReasoning(
  reasoningHistory: ChatMessageReasoningMessage[]
): ExtractedFile[] {
  const files: ExtractedFile[] = [];

  for (const entry of reasoningHistory) {
    // Multi-layer safety checks:
    // 1. Must be a files entry with completed status
    // 2. Must not have any failure indicators (additional safety net)
    // 3. Individual files must have completed status
    if (
      entry.type === 'files' && 
      entry.status === 'completed' && 
      entry.files && 
      !hasFailureIndicators(entry)
    ) {
      for (const fileId of entry.file_ids || []) {
        const file = entry.files[fileId];
        
        // Enhanced file validation:
        // - File must exist and have completed status
        // - File must not have error indicators
        // - File must have required properties (file_type, file_name)
        if (
          file && 
          file.status === 'completed' && 
          file.file_type && 
          file.file_name &&
          !hasFileFailureIndicators(file)
        ) {
          files.push({
            id: fileId,
            fileType: file.file_type as 'metric' | 'dashboard',
            fileName: file.file_name,
            status: 'completed',
            ymlContent: file.file?.text,
          });
        }
      }
    }
  }

  return files;
}

function selectFilesForResponse(files: ExtractedFile[]): ExtractedFile[] {
  // Separate dashboards and metrics
  const dashboards = files.filter((f) => f.fileType === 'dashboard');
  const metrics = files.filter((f) => f.fileType === 'metric');

  // Apply priority logic
  if (dashboards.length > 0) {
    return dashboards; // Return all dashboards
  }
  if (metrics.length > 0) {
    return metrics; // Return all metrics
  }

  return []; // No files to return
}

function createFileResponseMessages(files: ExtractedFile[]): ChatMessageResponseMessage[] {
  return files.map((file) => ({
    id: crypto.randomUUID(),
    type: 'file' as const,
    file_type: file.fileType,
    file_name: file.fileName,
    version_number: 1,
    filter_version_id: null,
    metadata: [
      {
        status: 'completed' as const,
        message: `${file.fileType === 'dashboard' ? 'Dashboard' : 'Metric'} created successfully`,
        timestamp: Date.now(),
      },
    ],
  }));
}

describe('Analyst Step File Selection', () => {
  describe('extractFilesFromReasoning', () => {
    test('should extract completed metric files', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating 2 metrics',
          status: 'completed',
          file_ids: ['file-1', 'file-2'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'revenue_metric.yml',
              version_number: 1,
              status: 'completed',
              file: {
                text: 'metric: revenue\ntype: sum',
              },
            },
            'file-2': {
              id: 'file-2',
              file_type: 'metric',
              file_name: 'user_count_metric.yml',
              version_number: 1,
              status: 'completed',
              file: {
                text: 'metric: user_count\ntype: count',
              },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      expect(extracted).toHaveLength(2);
      expect(extracted[0]).toEqual({
        id: 'file-1',
        fileType: 'metric',
        fileName: 'revenue_metric.yml',
        status: 'completed',
        ymlContent: 'metric: revenue\ntype: sum',
      });
      expect(extracted[1]).toEqual({
        id: 'file-2',
        fileType: 'metric',
        fileName: 'user_count_metric.yml',
        status: 'completed',
        ymlContent: 'metric: user_count\ntype: count',
      });
    });

    test('should extract completed dashboard files', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating 1 dashboard',
          status: 'completed',
          file_ids: ['dash-1'],
          files: {
            'dash-1': {
              id: 'dash-1',
              file_type: 'dashboard',
              file_name: 'sales_dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: {
                text: 'dashboard: sales\nmetrics: [revenue, user_count]',
              },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      expect(extracted).toHaveLength(1);
      expect(extracted[0]).toEqual({
        id: 'dash-1',
        fileType: 'dashboard',
        fileName: 'sales_dashboard.yml',
        status: 'completed',
        ymlContent: 'dashboard: sales\nmetrics: [revenue, user_count]',
      });
    });

    test('should skip files with loading or failed status', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed', // Entry is completed but individual files may not be
          file_ids: ['file-1', 'file-2', 'file-3'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'metric1.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'completed metric' },
            },
            'file-2': {
              id: 'file-2',
              file_type: 'metric',
              file_name: 'metric2.yml',
              version_number: 1,
              status: 'loading',
              file: { text: 'loading metric' },
            },
            'file-3': {
              id: 'file-3',
              file_type: 'metric',
              file_name: 'metric3.yml',
              version_number: 1,
              status: 'failed',
              file: { text: 'failed metric' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      expect(extracted).toHaveLength(1);
      const firstExtracted = extracted[0];
      expect(firstExtracted).toBeDefined();
      expect(firstExtracted?.id).toBe('file-1');
      expect(firstExtracted?.status).toBe('completed');
    });

    test('should skip reasoning entries with non-completed status', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating metrics',
          status: 'loading', // Still in progress
          file_ids: ['file-1'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'metric.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric content' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      expect(extracted).toHaveLength(0);
    });

    test('should handle mixed file types from multiple entries', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['metric-1', 'metric-2'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'metric1.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 1' },
            },
            'metric-2': {
              id: 'metric-2',
              file_type: 'metric',
              file_name: 'metric2.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 2' },
            },
          },
        },
        {
          id: 'reason-2',
          type: 'files',
          title: 'Creating dashboard',
          status: 'completed',
          file_ids: ['dash-1'],
          files: {
            'dash-1': {
              id: 'dash-1',
              file_type: 'dashboard',
              file_name: 'dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'dashboard content' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      expect(extracted).toHaveLength(3);
      expect(extracted.filter((f) => f.fileType === 'metric')).toHaveLength(2);
      expect(extracted.filter((f) => f.fileType === 'dashboard')).toHaveLength(1);
    });

    test('should handle empty reasoning history', () => {
      const extracted = extractFilesFromReasoning([]);
      expect(extracted).toHaveLength(0);
    });

    test('should reject files from entries with error indicators (failure detection)', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'entry-with-error',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed', // Status says completed
          error: 'Validation warnings occurred', // But has error field - this should prevent file extraction
          file_ids: ['file-1'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'metric.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: test' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should extract no files due to error indicator in entry
      // With our new logic, entry-level errors should still prevent extraction
      expect(extracted).toHaveLength(0);
    });

    test('should reject individual files with error properties (enhanced validation)', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'entry-clean',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['file-1', 'file-2'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'good_metric.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: good' },
            },
            'file-2': {
              id: 'file-2',
              file_type: 'metric',
              file_name: 'problematic_metric.yml',
              version_number: 1,
              status: 'completed', // Status completed
              error: 'Schema validation warning', // But has error property
              file: { text: 'metric: problematic' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should only extract the file without error properties
      expect(extracted).toHaveLength(1);
      const goodFile = extracted[0];
      expect(goodFile).toBeDefined();
      expect(goodFile?.id).toBe('file-1');
      expect(goodFile?.fileName).toBe('good_metric.yml');
    });

    test('should skip non-file reasoning entries', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'text',
          title: 'Thinking...',
          status: 'completed',
          message: 'Some thinking process',
        },
        {
          id: 'reason-2',
          type: 'pills',
          title: 'Analysis',
          status: 'completed',
          pill_containers: [],
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      expect(extracted).toHaveLength(0);
    });
  });

  describe('selectFilesForResponse', () => {
    test('should return all dashboards when dashboards exist', () => {
      const files: ExtractedFile[] = [
        { id: 'dash-1', fileType: 'dashboard', fileName: 'dash1.yml', status: 'completed' },
        { id: 'dash-2', fileType: 'dashboard', fileName: 'dash2.yml', status: 'completed' },
        { id: 'metric-1', fileType: 'metric', fileName: 'metric1.yml', status: 'completed' },
        { id: 'metric-2', fileType: 'metric', fileName: 'metric2.yml', status: 'completed' },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(2);
      expect(selected.every((f) => f.fileType === 'dashboard')).toBe(true);
      expect(selected.map((f) => f.id)).toEqual(['dash-1', 'dash-2']);
    });

    test('should return all metrics when only metrics exist', () => {
      const files: ExtractedFile[] = [
        { id: 'metric-1', fileType: 'metric', fileName: 'metric1.yml', status: 'completed' },
        { id: 'metric-2', fileType: 'metric', fileName: 'metric2.yml', status: 'completed' },
        { id: 'metric-3', fileType: 'metric', fileName: 'metric3.yml', status: 'completed' },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(3);
      expect(selected.every((f) => f.fileType === 'metric')).toBe(true);
      expect(selected.map((f) => f.id)).toEqual(['metric-1', 'metric-2', 'metric-3']);
    });

    test('should return single metric when only one metric exists', () => {
      const files: ExtractedFile[] = [
        { id: 'metric-1', fileType: 'metric', fileName: 'metric1.yml', status: 'completed' },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(1);
      const firstSelected = selected[0];
      expect(firstSelected).toBeDefined();
      expect(firstSelected?.id).toBe('metric-1');
      expect(firstSelected?.fileType).toBe('metric');
    });

    test('should return single dashboard when only one dashboard exists', () => {
      const files: ExtractedFile[] = [
        { id: 'dash-1', fileType: 'dashboard', fileName: 'dash1.yml', status: 'completed' },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(1);
      const firstSelected = selected[0];
      expect(firstSelected).toBeDefined();
      expect(firstSelected?.id).toBe('dash-1');
      expect(firstSelected?.fileType).toBe('dashboard');
    });

    test('should return empty array when no files exist', () => {
      const selected = selectFilesForResponse([]);
      expect(selected).toHaveLength(0);
    });

    test('should prioritize single dashboard over multiple metrics', () => {
      const files: ExtractedFile[] = [
        { id: 'metric-1', fileType: 'metric', fileName: 'metric1.yml', status: 'completed' },
        { id: 'metric-2', fileType: 'metric', fileName: 'metric2.yml', status: 'completed' },
        { id: 'metric-3', fileType: 'metric', fileName: 'metric3.yml', status: 'completed' },
        { id: 'dash-1', fileType: 'dashboard', fileName: 'dash1.yml', status: 'completed' },
      ];

      const selected = selectFilesForResponse(files);

      expect(selected).toHaveLength(1);
      const firstSelected = selected[0];
      expect(firstSelected).toBeDefined();
      expect(firstSelected?.id).toBe('dash-1');
      expect(firstSelected?.fileType).toBe('dashboard');
    });
  });

  describe('createFileResponseMessages', () => {
    test('should create response messages for metric files', () => {
      const files: ExtractedFile[] = [
        { id: 'metric-1', fileType: 'metric', fileName: 'revenue.yml', status: 'completed' },
        { id: 'metric-2', fileType: 'metric', fileName: 'users.yml', status: 'completed' },
      ];

      const messages = createFileResponseMessages(files);

      expect(messages).toHaveLength(2);

      const firstMessage = messages[0];
      expect(firstMessage).toBeDefined();
      expect(firstMessage).toMatchObject({
        type: 'file',
        file_type: 'metric',
        file_name: 'revenue.yml',
        version_number: 1,
        filter_version_id: null,
      });
      if (firstMessage && firstMessage.type === 'file' && firstMessage.metadata) {
        const firstMetadata = firstMessage.metadata[0];
        expect(firstMetadata).toBeDefined();
        expect(firstMetadata).toMatchObject({
          status: 'completed',
          message: 'Metric created successfully',
        });
        expect(firstMetadata?.timestamp).toBeTypeOf('number');
      }

      expect(messages[1]).toMatchObject({
        type: 'file',
        file_type: 'metric',
        file_name: 'users.yml',
        version_number: 1,
      });
    });

    test('should create response messages for dashboard files', () => {
      const files: ExtractedFile[] = [
        {
          id: 'dash-1',
          fileType: 'dashboard',
          fileName: 'sales_dashboard.yml',
          status: 'completed',
        },
      ];

      const messages = createFileResponseMessages(files);

      expect(messages).toHaveLength(1);

      const firstMessage = messages[0];
      expect(firstMessage).toBeDefined();
      expect(firstMessage).toMatchObject({
        type: 'file',
        file_type: 'dashboard',
        file_name: 'sales_dashboard.yml',
        version_number: 1,
        filter_version_id: null,
      });
      if (firstMessage && firstMessage.type === 'file' && firstMessage.metadata) {
        const firstMetadata = firstMessage.metadata[0];
        expect(firstMetadata).toBeDefined();
        expect(firstMetadata).toMatchObject({
          status: 'completed',
          message: 'Dashboard created successfully',
        });
      }
    });

    test('should generate unique IDs for each message', () => {
      const files: ExtractedFile[] = [
        { id: 'file-1', fileType: 'metric', fileName: 'metric1.yml', status: 'completed' },
        { id: 'file-2', fileType: 'metric', fileName: 'metric2.yml', status: 'completed' },
      ];

      const messages = createFileResponseMessages(files);

      const firstMessage = messages[0];
      const secondMessage = messages[1];
      expect(firstMessage).toBeDefined();
      expect(secondMessage).toBeDefined();
      expect(firstMessage?.id).toBeTypeOf('string');
      expect(secondMessage?.id).toBeTypeOf('string');
      expect(firstMessage?.id).not.toBe(secondMessage?.id);
    });

    test('should handle empty file array', () => {
      const messages = createFileResponseMessages([]);
      expect(messages).toHaveLength(0);
    });
  });

  describe('Integration: Complete File Selection Flow', () => {
    test('Scenario 1: Only dashboards created - return all dashboards', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating dashboards',
          status: 'completed',
          file_ids: ['dash-1', 'dash-2'],
          files: {
            'dash-1': {
              id: 'dash-1',
              file_type: 'dashboard',
              file_name: 'sales_dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'dashboard 1 content' },
            },
            'dash-2': {
              id: 'dash-2',
              file_type: 'dashboard',
              file_name: 'marketing_dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'dashboard 2 content' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      const selected = selectFilesForResponse(extracted);
      const messages = createFileResponseMessages(selected);

      expect(extracted).toHaveLength(2);
      expect(selected).toHaveLength(2);
      expect(messages).toHaveLength(2);
      expect(messages.every((m) => m.type === 'file' && m.file_type === 'dashboard')).toBe(true);
    });

    test('Scenario 2: Multiple metrics created - return all metrics', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['metric-1', 'metric-2', 'metric-3'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'revenue.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 1' },
            },
            'metric-2': {
              id: 'metric-2',
              file_type: 'metric',
              file_name: 'users.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 2' },
            },
            'metric-3': {
              id: 'metric-3',
              file_type: 'metric',
              file_name: 'growth.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 3' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      const selected = selectFilesForResponse(extracted);
      const messages = createFileResponseMessages(selected);

      expect(extracted).toHaveLength(3);
      expect(selected).toHaveLength(3);
      expect(messages).toHaveLength(3);
      expect(messages.every((m) => m.type === 'file' && m.file_type === 'metric')).toBe(true);
    });

    test('Scenario 3: Single metric created - return the single metric', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating metric',
          status: 'completed',
          file_ids: ['metric-1'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'revenue.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'single metric' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      const selected = selectFilesForResponse(extracted);
      const messages = createFileResponseMessages(selected);

      expect(extracted).toHaveLength(1);
      expect(selected).toHaveLength(1);
      expect(messages).toHaveLength(1);
      const firstMessage = messages[0];
      expect(firstMessage).toBeDefined();
      expect(firstMessage?.type).toBe('file');
      if (firstMessage && firstMessage.type === 'file') {
        expect(firstMessage.file_type).toBe('metric');
      }
    });

    test('Scenario 4: Metrics and dashboards created - return only dashboards', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['metric-1', 'metric-2'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'revenue.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 1' },
            },
            'metric-2': {
              id: 'metric-2',
              file_type: 'metric',
              file_name: 'users.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric 2' },
            },
          },
        },
        {
          id: 'reason-2',
          type: 'files',
          title: 'Creating dashboards',
          status: 'completed',
          file_ids: ['dash-1', 'dash-2'],
          files: {
            'dash-1': {
              id: 'dash-1',
              file_type: 'dashboard',
              file_name: 'sales_dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'dashboard 1' },
            },
            'dash-2': {
              id: 'dash-2',
              file_type: 'dashboard',
              file_name: 'marketing_dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'dashboard 2' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      const selected = selectFilesForResponse(extracted);
      const messages = createFileResponseMessages(selected);

      expect(extracted).toHaveLength(4); // 2 metrics + 2 dashboards
      expect(selected).toHaveLength(2); // Only dashboards
      expect(messages).toHaveLength(2);
      expect(messages.every((m) => m.type === 'file' && m.file_type === 'dashboard')).toBe(true);
      expect(messages.map((m) => (m.type === 'file' ? m.file_name : ''))).toEqual([
        'sales_dashboard.yml',
        'marketing_dashboard.yml',
      ]);
    });

    test('Scenario 5: Modified files are also included', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'files',
          title: 'Modifying metrics',
          status: 'completed',
          file_ids: ['metric-1-mod', 'metric-2-mod'],
          files: {
            'metric-1-mod': {
              id: 'metric-1-mod',
              file_type: 'metric',
              file_name: 'revenue_modified.yml',
              version_number: 2,
              status: 'completed',
              file: { text: 'modified metric 1' },
            },
            'metric-2-mod': {
              id: 'metric-2-mod',
              file_type: 'metric',
              file_name: 'users_modified.yml',
              version_number: 2,
              status: 'completed',
              file: { text: 'modified metric 2' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      const selected = selectFilesForResponse(extracted);
      const messages = createFileResponseMessages(selected);

      expect(extracted).toHaveLength(2);
      expect(selected).toHaveLength(2);
      expect(messages).toHaveLength(2);
      expect(messages.every((m) => m.type === 'file' && m.file_type === 'metric')).toBe(true);
    });

    test('Scenario 6: No files created - return empty', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'reason-1',
          type: 'text',
          title: 'Thinking',
          status: 'completed',
          message: 'Just thinking, no files created',
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);
      const selected = selectFilesForResponse(extracted);
      const messages = createFileResponseMessages(selected);

      expect(extracted).toHaveLength(0);
      expect(selected).toHaveLength(0);
      expect(messages).toHaveLength(0);
    });
  });
});
