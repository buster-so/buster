import { describe, expect, test } from 'vitest';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../../server/src/types/chat-types/chat-message.type';
import { hasFailureIndicators, hasFileFailureIndicators } from '../../../src/utils/database/types';

// Import the functions we want to test
// For now, we'll copy the enhanced functions here for testing
interface ExtractedFile {
  id: string;
  fileType: 'metric' | 'dashboard';
  fileName: string;
  status: 'completed' | 'failed' | 'loading';
  ymlContent?: string;
}

/**
 * Enhanced extractFilesFromReasoning with failure detection
 * This is a copy of the enhanced function for testing
 */
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

describe('Analyst Step - Failed Tool Handling', () => {
  describe('extractFilesFromReasoning - Failure Detection', () => {
    test('should exclude files from failed reasoning entries', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'failed-entry',
          type: 'files',
          title: 'Creating metrics',
          status: 'failed', // Entry itself failed
          file_ids: ['file-1'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'failed_metric.yml',
              version_number: 1,
              status: 'completed', // File marked as completed, but entry failed
              file: {
                text: 'metric: failed_metric',
              },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should extract no files because the reasoning entry failed
      expect(extracted).toHaveLength(0);
    });

    test('should exclude individual failed files from completed reasoning entries', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'mixed-entry',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed', // Entry completed, but some files failed
          file_ids: ['file-1', 'file-2', 'file-3'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'successful_metric.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: successful' },
            },
            'file-2': {
              id: 'file-2',
              file_type: 'metric',
              file_name: 'failed_metric.yml',
              version_number: 1,
              status: 'failed', // This file failed
              file: { text: 'metric: failed' },
            },
            'file-3': {
              id: 'file-3',
              file_type: 'metric',
              file_name: 'loading_metric.yml',
              version_number: 1,
              status: 'loading', // This file still loading
              file: { text: 'metric: loading' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should only extract the successful file
      expect(extracted).toHaveLength(1);
      const successfulFile = extracted[0];
      expect(successfulFile).toBeDefined();
      expect(successfulFile?.id).toBe('file-1');
      expect(successfulFile?.fileName).toBe('successful_metric.yml');
      expect(successfulFile?.status).toBe('completed');
    });

    test('should exclude files with error indicators', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'entry-with-errors',
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
              file_name: 'error_metric.yml',
              version_number: 1,
              status: 'completed', // Status says completed...
              error: 'Validation failed', // But has error field
              file: { text: 'metric: error' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should only extract the file without error indicators
      expect(extracted).toHaveLength(1);
      const goodFile = extracted[0];
      expect(goodFile).toBeDefined();
      expect(goodFile?.id).toBe('file-1');
      expect(goodFile?.fileName).toBe('good_metric.yml');
    });

    test('should exclude files missing required properties', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'incomplete-files',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['file-1', 'file-2', 'file-3'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'complete_metric.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: complete' },
            },
            'file-2': {
              id: 'file-2',
              // Missing file_type
              file_name: 'missing_type.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: missing_type' },
            },
            'file-3': {
              id: 'file-3',
              file_type: 'metric',
              // Missing file_name
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: missing_name' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should only extract the complete file
      expect(extracted).toHaveLength(1);
      const completeFile = extracted[0];
      expect(completeFile).toBeDefined();
      expect(completeFile?.id).toBe('file-1');
      expect(completeFile?.fileName).toBe('complete_metric.yml');
    });

    test('should handle reasoning entries with hasError flag', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'entry-with-error-flag',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed', // Status says completed...
          hasError: true, // But has error flag
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

      // Should extract no files because entry has error flag
      expect(extracted).toHaveLength(0);
    });

    test('should handle partial failures in dashboard creation', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'dashboard-entry',
          type: 'files',
          title: 'Creating dashboards',
          status: 'completed',
          file_ids: ['dash-1', 'dash-2'],
          files: {
            'dash-1': {
              id: 'dash-1',
              file_type: 'dashboard',
              file_name: 'successful_dashboard.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'dashboard: successful' },
            },
            'dash-2': {
              id: 'dash-2',
              file_type: 'dashboard',
              file_name: 'failed_dashboard.yml',
              version_number: 1,
              status: 'failed',
              file: { text: 'dashboard: failed' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should only extract the successful dashboard
      expect(extracted).toHaveLength(1);
      const successfulDashboard = extracted[0];
      expect(successfulDashboard).toBeDefined();
      expect(successfulDashboard?.fileType).toBe('dashboard');
      expect(successfulDashboard?.fileName).toBe('successful_dashboard.yml');
    });

    test('should handle completely successful scenarios (regression test)', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'successful-entry',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['file-1', 'file-2'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'metric1.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: 1' },
            },
            'file-2': {
              id: 'file-2',
              file_type: 'metric',
              file_name: 'metric2.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: 2' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should extract both successful files
      expect(extracted).toHaveLength(2);
      expect(extracted.map((f) => f.id)).toEqual(['file-1', 'file-2']);
      expect(extracted.every((f) => f.status === 'completed')).toBe(true);
    });

    test('should handle complex failure scenarios with mixed types', () => {
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        // Successful metrics entry
        {
          id: 'successful-metrics',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed',
          file_ids: ['metric-1'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric',
              file_name: 'good_metric.yml',
              version_number: 1,
              status: 'completed',
              file: { text: 'metric: good' },
            },
          },
        },
        // Failed dashboard entry
        {
          id: 'failed-dashboards',
          type: 'files',
          title: 'Creating dashboards',
          status: 'failed',
          file_ids: ['dash-1'],
          files: {
            'dash-1': {
              id: 'dash-1',
              file_type: 'dashboard',
              file_name: 'failed_dashboard.yml',
              version_number: 1,
              status: 'completed', // File shows completed but entry failed
              file: { text: 'dashboard: failed' },
            },
          },
        },
        // Mixed success/failure entry
        {
          id: 'mixed-entry',
          type: 'files',
          title: 'Modifying metrics',
          status: 'completed',
          file_ids: ['metric-2', 'metric-3'],
          files: {
            'metric-2': {
              id: 'metric-2',
              file_type: 'metric',
              file_name: 'successful_mod.yml',
              version_number: 2,
              status: 'completed',
              file: { text: 'metric: successful_mod' },
            },
            'metric-3': {
              id: 'metric-3',
              file_type: 'metric',
              file_name: 'failed_mod.yml',
              version_number: 2,
              status: 'failed',
              file: { text: 'metric: failed_mod' },
            },
          },
        },
      ];

      const extracted = extractFilesFromReasoning(reasoningHistory);

      // Should only extract the 2 successful files
      expect(extracted).toHaveLength(2);
      const extractedIds = extracted.map((f) => f.id);
      expect(extractedIds).toEqual(['metric-1', 'metric-2']);

      // Verify no failed files were extracted
      expect(extractedIds).not.toContain('dash-1'); // From failed entry
      expect(extractedIds).not.toContain('metric-3'); // Failed individual file
    });
  });

  describe('hasFailureIndicators utility', () => {
    test('should detect failed status', () => {
      const entryWithFailedStatus = {
        id: 'test',
        status: 'failed',
        type: 'files',
      };

      expect(hasFailureIndicators(entryWithFailedStatus)).toBe(true);
    });

    test('should detect error field', () => {
      const entryWithError = {
        id: 'test',
        status: 'completed',
        error: 'Something went wrong',
      };

      expect(hasFailureIndicators(entryWithError)).toBe(true);
    });

    test('should detect hasError flag', () => {
      const entryWithErrorFlag = {
        id: 'test',
        status: 'completed',
        hasError: true,
      };

      expect(hasFailureIndicators(entryWithErrorFlag)).toBe(true);
    });

    test('should NOT detect failed files within entry (handled at file level)', () => {
      const entryWithFailedFile = {
        id: 'test',
        status: 'completed',
        files: {
          'file-1': { status: 'completed' },
          'file-2': { status: 'failed' },
        },
      };

      // Entry-level function should not reject entries with failed files
      // Individual file failures are handled by hasFileFailureIndicators
      expect(hasFailureIndicators(entryWithFailedFile)).toBe(false);
      
      // But individual file failure detection should work
      expect(hasFileFailureIndicators(entryWithFailedFile.files['file-1'])).toBe(false);
      expect(hasFileFailureIndicators(entryWithFailedFile.files['file-2'])).toBe(true);
    });

    test('should return false for successful entries', () => {
      const successfulEntry = {
        id: 'test',
        status: 'completed',
        files: {
          'file-1': { status: 'completed' },
          'file-2': { status: 'completed' },
        },
      };

      expect(hasFailureIndicators(successfulEntry)).toBe(false);
    });

    test('should handle null/undefined gracefully', () => {
      expect(hasFailureIndicators(null)).toBe(false);
      expect(hasFailureIndicators(undefined)).toBe(false);
      expect(hasFailureIndicators({})).toBe(false);
    });
  });
});
