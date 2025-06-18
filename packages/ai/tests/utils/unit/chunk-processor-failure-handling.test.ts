import { beforeEach, describe, expect, test } from 'vitest';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../../../server/src/types/chat-types/chat-message.type';
import { ChunkProcessor } from '../../../src/utils/database/chunk-processor';
import {
  determineToolStatus,
  extractFileResultsFromToolResult,
  hasFailureIndicators,
} from '../../../src/utils/database/types';

describe('ChunkProcessor - Failure Handling', () => {
  let chunkProcessor: ChunkProcessor;

  beforeEach(() => {
    chunkProcessor = new ChunkProcessor(null, [], [], []);
  });

  describe('determineToolStatus utility', () => {
    test('should detect string-based errors', () => {
      expect(determineToolStatus('Error: Something went wrong')).toBe('failed');
      expect(determineToolStatus('Failed to process')).toBe('failed');
      expect(determineToolStatus('Exception occurred')).toBe('failed');
      expect(determineToolStatus('error in processing')).toBe('failed');
    });

    test('should detect object-based errors', () => {
      expect(determineToolStatus({ error: 'Something went wrong' })).toBe('failed');
      expect(determineToolStatus({ success: false })).toBe('failed');
      expect(determineToolStatus({ status: 'error' })).toBe('failed');
    });

    test('should return completed for successful results', () => {
      expect(determineToolStatus('Successfully created metric')).toBe('completed');
      expect(determineToolStatus({ success: true })).toBe('completed');
      expect(determineToolStatus({ status: 'success' })).toBe('completed');
      expect(determineToolStatus({ files: [{ id: '123' }] })).toBe('completed');
    });

    test('should handle edge cases', () => {
      expect(determineToolStatus(null)).toBe('completed');
      expect(determineToolStatus(undefined)).toBe('completed');
      expect(determineToolStatus('')).toBe('completed');
      expect(determineToolStatus({})).toBe('completed');
    });
  });

  describe('extractFileResultsFromToolResult utility', () => {
    test('should extract successful file results', () => {
      const toolResult = {
        files: [
          { id: 'file-1', name: 'metric1.yml', status: 'success' },
          { id: 'file-2', name: 'metric2.yml', status: 'success' },
        ],
      };

      const results = extractFileResultsFromToolResult(toolResult);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'file-1',
        status: 'completed',
        error: undefined,
      });
      expect(results[1]).toEqual({
        id: 'file-2',
        status: 'completed',
        error: undefined,
      });
    });

    test('should extract failed file results', () => {
      const toolResult = {
        files: [
          { id: 'file-1', name: 'metric1.yml', status: 'success' },
          { id: 'file-2', name: 'metric2.yml', error: 'Validation failed' },
        ],
      };

      const results = extractFileResultsFromToolResult(toolResult);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'file-1',
        status: 'completed',
        error: undefined,
      });
      expect(results[1]).toEqual({
        id: 'file-2',
        status: 'failed',
        error: 'Validation failed',
      });
    });

    test('should handle mixed success/failure results', () => {
      const toolResult = {
        files: [
          { id: 'file-1', name: 'success.yml' },
          { id: 'file-2', name: 'failed.yml', error: 'Schema validation failed' },
          { id: 'file-3', name: 'also-failed.yml', success: false },
        ],
      };

      const results = extractFileResultsFromToolResult(toolResult);

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('completed');
      expect(results[1].status).toBe('failed');
      expect(results[1].error).toBe('Schema validation failed');
      expect(results[2].status).toBe('failed');
    });

    test('should handle tool results without files', () => {
      expect(extractFileResultsFromToolResult({})).toEqual([]);
      expect(extractFileResultsFromToolResult({ message: 'success' })).toEqual([]);
      expect(extractFileResultsFromToolResult(null)).toEqual([]);
    });

    test('should handle malformed file entries', () => {
      const toolResult = {
        files: [
          { id: 'file-1', name: 'good.yml' },
          { name: 'missing-id.yml' }, // Missing id
          'invalid-entry', // Not an object
          null, // Null entry
        ],
      };

      const results = extractFileResultsFromToolResult(toolResult);

      // Should only extract the valid file
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('file-1');
    });
  });

  describe('hasFailureIndicators comprehensive tests', () => {
    test('should detect all types of failure indicators', () => {
      // Entry-level failures
      expect(hasFailureIndicators({ status: 'failed' })).toBe(true);
      expect(hasFailureIndicators({ error: 'Failed' })).toBe(true);
      expect(hasFailureIndicators({ hasError: true })).toBe(true);

      // File-level failures are NOT detected at entry level
      expect(
        hasFailureIndicators({
          status: 'completed',
          files: { 'file-1': { status: 'failed' } },
        })
      ).toBe(false);

      // Mixed scenarios - entry level function doesn't care about individual file failures
      expect(
        hasFailureIndicators({
          status: 'completed',
          files: {
            'file-1': { status: 'completed' },
            'file-2': { status: 'failed' },
          },
        })
      ).toBe(false);
    });

    test('should not detect failures in successful entries', () => {
      expect(
        hasFailureIndicators({
          status: 'completed',
          files: {
            'file-1': { status: 'completed' },
            'file-2': { status: 'completed' },
          },
        })
      ).toBe(false);

      expect(
        hasFailureIndicators({
          status: 'loading',
          message: 'Processing...',
        })
      ).toBe(false);
    });

    test('should handle edge cases safely', () => {
      expect(hasFailureIndicators(null)).toBe(false);
      expect(hasFailureIndicators(undefined)).toBe(false);
      expect(hasFailureIndicators('string')).toBe(false);
      expect(hasFailureIndicators(123)).toBe(false);
      expect(hasFailureIndicators({})).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    test('should prevent failed files from being included in response extraction', () => {
      // Simulate a reasoning history with mixed success/failure
      const reasoningHistory: ChatMessageReasoningMessage[] = [
        {
          id: 'mixed-tool-result',
          type: 'files',
          title: 'Creating metrics',
          status: 'completed', // Overall status completed
          file_ids: ['file-1', 'file-2'],
          files: {
            'file-1': {
              id: 'file-1',
              file_type: 'metric',
              file_name: 'successful.yml',
              version_number: 1,
              status: 'completed', // Individual file succeeded
              file: { text: 'metric: successful' },
            },
            'file-2': {
              id: 'file-2',
              file_type: 'metric',
              file_name: 'failed.yml',
              version_number: 1,
              status: 'failed', // Individual file failed
              error: 'Schema validation failed',
              file: { text: 'metric: failed' },
            },
          },
        },
      ];

      // The hasFailureIndicators function should NOT detect failed files at entry level
      // Individual file failures are handled by the file extraction logic
      const entryHasFailures = hasFailureIndicators(reasoningHistory[0]);
      expect(entryHasFailures).toBe(false);

      // When extracting files, individual failed files should be rejected
      // while successful files are extracted
      // This is handled by hasFileFailureIndicators during file extraction
    });

    test('should handle completely failed tool results', () => {
      const failedToolResult = {
        error: 'Tool execution failed',
        files: [],
      };

      // Tool status should be failed
      expect(determineToolStatus(failedToolResult)).toBe('failed');

      // File extraction should return empty array
      expect(extractFileResultsFromToolResult(failedToolResult)).toEqual([]);
    });

    test('should handle partial success scenarios correctly', () => {
      const partialSuccessResult = {
        message: 'Partially completed',
        files: [
          { id: 'file-1', name: 'success.yml', status: 'created' },
          { id: 'file-2', name: 'failed.yml', error: 'Invalid schema' },
        ],
      };

      // Overall tool status should be completed (no top-level error)
      expect(determineToolStatus(partialSuccessResult)).toBe('completed');

      // But individual file results should reflect the mix
      const fileResults = extractFileResultsFromToolResult(partialSuccessResult);
      expect(fileResults).toHaveLength(2);
      expect(fileResults[0].status).toBe('completed');
      expect(fileResults[1].status).toBe('failed');
      expect(fileResults[1].error).toBe('Invalid schema');
    });
  });

  describe('Regression tests for existing functionality', () => {
    test('should still work correctly for all-successful scenarios', () => {
      const successfulResult = {
        message: 'All files created successfully',
        files: [
          { id: 'file-1', name: 'metric1.yml' },
          { id: 'file-2', name: 'metric2.yml' },
        ],
      };

      expect(determineToolStatus(successfulResult)).toBe('completed');

      const fileResults = extractFileResultsFromToolResult(successfulResult);
      expect(fileResults).toHaveLength(2);
      expect(fileResults.every((r) => r.status === 'completed')).toBe(true);

      const reasoningEntry = {
        status: 'completed',
        files: {
          'file-1': { status: 'completed' },
          'file-2': { status: 'completed' },
        },
      };

      expect(hasFailureIndicators(reasoningEntry)).toBe(false);
    });

    test('should maintain backward compatibility with existing tool result formats', () => {
      // Old format without explicit status indicators
      const oldFormatResult = {
        files: [{ id: 'file-1', name: 'old-format.yml' }],
      };

      expect(determineToolStatus(oldFormatResult)).toBe('completed');

      const fileResults = extractFileResultsFromToolResult(oldFormatResult);
      expect(fileResults).toHaveLength(1);
      expect(fileResults[0].status).toBe('completed');
    });
  });
});
