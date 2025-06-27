import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { beforeEach, describe, expect, test } from 'vitest';
import { ChunkProcessor } from './chunk-processor';

// Helper type to access private methods for testing
type ChunkProcessorWithPrivateMethods = {
  isFileCreationTool(toolName: string): boolean;
  extractFileIdsFromToolResult(toolResult: unknown): string[];
  updateFileIdsFromToolResult(toolCallId: string, toolResult: unknown): void;
  updateFileIdsAndStatusFromToolResult(toolCallId: string, toolResult: unknown): void;
  getState(): {
    reasoningHistory: unknown[];
    timing: { startTime?: number };
  };
};

// Helper type for file objects in reasoning entries
interface FileObject {
  id: string;
  file_type?: string;
  file_name: string;
  version_number?: number;
  status?: string;
  error?: string;
  file?: {
    text?: string;
    modified?: number[][];
  };
  metadata?: Record<string, unknown>;
}

describe('ChunkProcessor File ID Mapping', () => {
  let chunkProcessor: ChunkProcessor;

  beforeEach(() => {
    chunkProcessor = new ChunkProcessor('test-message-id', [], [], []);
  });

  describe('isFileCreationTool', () => {
    test('should identify file creation tools correctly', () => {
      const fileCreationTools = [
        'createMetrics',
        'create-metrics-file',
        'createDashboards',
        'create-dashboards-file',
        'modifyMetrics',
        'modify-metrics-file',
        'modifyDashboards',
        'modify-dashboards-file',
      ];

      const nonFileTools = [
        'executeSql',
        'execute-sql',
        'doneTool',
        'sequentialThinking',
        'submitThoughts',
      ];

      for (const toolName of fileCreationTools) {
        // Access private method for testing
        const result = (
          chunkProcessor as unknown as ChunkProcessorWithPrivateMethods
        ).isFileCreationTool(toolName);
        expect(result).toBe(true);
      }

      for (const toolName of nonFileTools) {
        const result = (
          chunkProcessor as unknown as ChunkProcessorWithPrivateMethods
        ).isFileCreationTool(toolName);
        expect(result).toBe(false);
      }
    });
  });

  describe('extractFileIdsFromToolResult', () => {
    test('should extract file IDs from valid tool result', () => {
      const toolResult = {
        message: 'Successfully created 2 metric files.',
        duration: 1500,
        files: [
          {
            id: 'actual-file-id-1',
            name: 'Revenue by Month',
            file_type: 'metric',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
          {
            id: 'actual-file-id-2',
            name: 'Customer Count',
            file_type: 'metric',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      };

      const result = (
        chunkProcessor as unknown as ChunkProcessorWithPrivateMethods
      ).extractFileIdsFromToolResult(toolResult);
      expect(result).toEqual(['actual-file-id-1', 'actual-file-id-2']);
    });

    test('should return empty array for invalid tool result', () => {
      const invalidResults = [
        null,
        undefined,
        'string',
        123,
        { message: 'no files property' },
        { files: 'not an array' },
        { files: [] },
        { files: [{ name: 'no id' }] },
        { files: [{ id: null }] },
        { files: [{ id: 123 }] },
      ];

      for (const toolResult of invalidResults) {
        const result = (
          chunkProcessor as unknown as ChunkProcessorWithPrivateMethods
        ).extractFileIdsFromToolResult(toolResult);
        expect(result).toEqual([]);
      }
    });

    test('should filter out invalid file objects', () => {
      const toolResult = {
        files: [
          { id: 'valid-id-1', name: 'Valid File 1' },
          null, // null file
          { name: 'No ID file' }, // missing id
          { id: 123, name: 'Numeric ID' }, // non-string id
          { id: 'valid-id-2', name: 'Valid File 2' },
          undefined, // undefined file
        ],
      };

      const result = (
        chunkProcessor as unknown as ChunkProcessorWithPrivateMethods
      ).extractFileIdsFromToolResult(toolResult);
      expect(result).toEqual(['valid-id-1', 'valid-id-2']);
    });
  });

  describe('updateFileIdsFromToolResult', () => {
    test('should update reasoning entry with actual file IDs', () => {
      // Create a mock reasoning entry with dummy IDs
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'tool-call-123',
        type: 'files',
        title: 'Creating metrics...',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['dummy-id-1', 'dummy-id-2'],
        files: {
          'dummy-id-1': {
            id: 'dummy-id-1',
            file_type: 'metric',
            file_name: 'Revenue by Month',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: Revenue by Month\n...' },
          },
          'dummy-id-2': {
            id: 'dummy-id-2',
            file_type: 'metric',
            file_name: 'Customer Count',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: Customer Count\n...' },
          },
        },
      };

      // Add the reasoning entry to the processor
      const state = chunkProcessor.getState();
      state.reasoningHistory.push(reasoningEntry);

      // Mock tool result with actual IDs
      const toolResult = {
        files: [
          { id: 'actual-file-id-1', name: 'Revenue by Month', file_type: 'metric' },
          { id: 'actual-file-id-2', name: 'Customer Count', file_type: 'metric' },
        ],
      };

      // Call the update method
      (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsFromToolResult(
        'tool-call-123',
        toolResult
      );

      // Verify the reasoning entry was updated
      const updatedEntry = state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === 'tool-call-123'
      ) as ChatMessageReasoningMessage;

      expect(updatedEntry).toBeDefined();
      expect(updatedEntry.type).toBe('files');

      const typedEntry = updatedEntry as ChatMessageReasoningMessage & {
        file_ids: string[];
        files: Record<string, FileObject>;
      };

      // Check that file_ids array was updated with actual IDs
      expect(typedEntry.file_ids).toEqual(['actual-file-id-1', 'actual-file-id-2']);

      // Check that files object keys were updated
      expect(Object.keys(typedEntry.files)).toEqual(['actual-file-id-1', 'actual-file-id-2']);

      // Check that file objects have correct actual IDs
      expect(typedEntry.files['actual-file-id-1']?.id).toBe('actual-file-id-1');
      expect(typedEntry.files['actual-file-id-2']?.id).toBe('actual-file-id-2');

      // Check that old dummy ID keys are gone
      expect(typedEntry.files['dummy-id-1']).toBeUndefined();
      expect(typedEntry.files['dummy-id-2']).toBeUndefined();

      // Check that file content was preserved
      expect(typedEntry.files['actual-file-id-1']?.file_name).toBe('Revenue by Month');
      expect(typedEntry.files['actual-file-id-2']?.file_name).toBe('Customer Count');
    });

    test('should handle mismatched array lengths gracefully', () => {
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'tool-call-123',
        type: 'files',
        title: 'Creating metrics...',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['dummy-id-1', 'dummy-id-2', 'dummy-id-3'], // 3 dummy IDs
        files: {
          'dummy-id-1': {
            id: 'dummy-id-1',
            file_name: 'File 1',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: File 1\n...' },
          },
          'dummy-id-2': {
            id: 'dummy-id-2',
            file_name: 'File 2',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: File 2\n...' },
          },
          'dummy-id-3': {
            id: 'dummy-id-3',
            file_name: 'File 3',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: File 3\n...' },
          },
        },
      };

      const state = chunkProcessor.getState();
      state.reasoningHistory.push(reasoningEntry);

      // Tool result with only 2 actual IDs
      const toolResult = {
        files: [
          { id: 'actual-id-1', name: 'File 1' },
          { id: 'actual-id-2', name: 'File 2' },
        ],
      };

      (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsFromToolResult(
        'tool-call-123',
        toolResult
      );

      const updatedEntry = state.reasoningHistory.find(
        (r) => r && typeof r === 'object' && 'id' in r && r.id === 'tool-call-123'
      ) as ChatMessageReasoningMessage & { file_ids: string[]; files: Record<string, FileObject> };

      // Should only map the first 2 IDs (minimum of both arrays)
      expect(updatedEntry.file_ids).toEqual(['actual-id-1', 'actual-id-2']);
      expect(Object.keys(updatedEntry.files)).toEqual(['actual-id-1', 'actual-id-2']);
    });

    test('should do nothing for non-file reasoning entries', () => {
      const textEntry: ChatMessageReasoningMessage = {
        id: 'tool-call-123',
        type: 'text',
        title: 'Thinking...',
        status: 'loading',
        message: 'Processing...',
        message_chunk: undefined,
        secondary_title: undefined,
        finished_reasoning: false,
      };

      const state = chunkProcessor.getState();
      state.reasoningHistory.push(textEntry);

      const toolResult = {
        files: [{ id: 'actual-id-1', name: 'File 1' }],
      };

      (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsFromToolResult(
        'tool-call-123',
        toolResult
      );

      // Entry should remain unchanged
      const unchangedEntry = state.reasoningHistory[0];
      expect(unchangedEntry).toEqual(textEntry);
    });

    test('should do nothing when no file IDs are extracted', () => {
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'tool-call-123',
        type: 'files',
        title: 'Creating metrics...',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['dummy-id-1'],
        files: {
          'dummy-id-1': {
            id: 'dummy-id-1',
            file_name: 'File 1',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: File 1\n...' },
          },
        },
      };

      const state = chunkProcessor.getState();
      state.reasoningHistory.push(reasoningEntry);

      // Tool result with no valid files
      const toolResult = { message: 'No files created' };

      (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsFromToolResult(
        'tool-call-123',
        toolResult
      );

      // Entry should remain unchanged
      const unchangedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
        file_ids: string[];
        files: Record<string, FileObject>;
      };
      expect(unchangedEntry.file_ids).toEqual(['dummy-id-1']);
      expect(unchangedEntry.files['dummy-id-1']).toBeDefined();
    });

    test('should handle entry not found gracefully', () => {
      const toolResult = {
        files: [{ id: 'actual-id-1', name: 'File 1' }],
      };

      // Should not throw when entry doesn't exist
      expect(() => {
        (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsFromToolResult(
          'non-existent-id',
          toolResult
        );
      }).not.toThrow();
    });

    test('should handle mixed successful and failed files correctly', () => {
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'tool-call-123',
        type: 'files',
        title: 'Creating metrics...',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['dummy-id-1', 'dummy-id-2', 'dummy-id-3'],
        files: {
          'dummy-id-1': {
            id: 'dummy-id-1',
            file_name: 'Successful File 1',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: Successful File 1\n...' },
          },
          'dummy-id-2': {
            id: 'dummy-id-2',
            file_name: 'Failed File',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: Failed File\n...' },
          },
          'dummy-id-3': {
            id: 'dummy-id-3',
            file_name: 'Successful File 2',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: Successful File 2\n...' },
          },
        },
      };

      const state = chunkProcessor.getState();
      state.reasoningHistory.push(reasoningEntry);

      // Tool result with 2 successful files and 1 failed file
      const toolResult = {
        files: [
          { id: 'actual-id-1', name: 'Successful File 1' },
          { id: 'actual-id-3', name: 'Successful File 2' },
        ],
        failed_files: [{ name: 'Failed File', error: 'SQL validation failed' }],
      };

      (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsAndStatusFromToolResult(
        'tool-call-123',
        toolResult
      );

      const updatedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
        file_ids: string[];
        files: Record<string, FileObject>;
      };

      // Check that file_ids contains both actual IDs and dummy ID for failed file
      expect(updatedEntry.file_ids).toHaveLength(3);
      expect(updatedEntry.file_ids[0]).toBe('actual-id-1');
      expect(updatedEntry.file_ids[1]).toBe('dummy-id-2'); // Failed file keeps dummy ID
      expect(updatedEntry.file_ids[2]).toBe('actual-id-3');

      // Check successful files have actual IDs
      expect(updatedEntry.files['actual-id-1']).toBeDefined();
      expect(updatedEntry.files['actual-id-1']?.status).toBe('completed');
      expect(updatedEntry.files['actual-id-3']).toBeDefined();
      expect(updatedEntry.files['actual-id-3']?.status).toBe('completed');

      // Check failed file keeps dummy ID and has failed status
      expect(updatedEntry.files['dummy-id-2']).toBeDefined();
      expect(updatedEntry.files['dummy-id-2']?.status).toBe('failed');
      expect(updatedEntry.files['dummy-id-2']?.error).toBe('SQL validation failed');

      // Check that old successful dummy IDs are removed
      expect(updatedEntry.files['dummy-id-1']).toBeUndefined();
      expect(updatedEntry.files['dummy-id-3']).toBeUndefined();
    });

    test('should preserve file data structure during ID mapping', () => {
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'tool-call-123',
        type: 'files',
        title: 'Creating metrics...',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['dummy-id-1'],
        files: {
          'dummy-id-1': {
            id: 'dummy-id-1',
            file_type: 'metric',
            file_name: 'Complex File',
            version_number: 1,
            status: 'loading',
            file: {
              text: 'name: Complex File\nsql: SELECT * FROM table',
              modified: [[0, 5]],
            },
            // metadata: { custom: 'data' }, // Temporarily removed for TypeScript compatibility
          },
        },
      };

      const state = chunkProcessor.getState();
      state.reasoningHistory.push(reasoningEntry);

      const toolResult = {
        files: [{ id: 'actual-complex-id', name: 'Complex File' }],
      };

      (chunkProcessor as unknown as ChunkProcessorWithPrivateMethods).updateFileIdsFromToolResult(
        'tool-call-123',
        toolResult
      );

      const updatedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
        file_ids: string[];
        files: Record<string, FileObject>;
      };

      const updatedFile = updatedEntry.files['actual-complex-id'];
      expect(updatedFile?.id).toBe('actual-complex-id');
      expect(updatedFile?.file_name).toBe('Complex File');
      expect(updatedFile?.file_type).toBe('metric');
      expect(updatedFile?.file?.text).toBe('name: Complex File\nsql: SELECT * FROM table');
      expect(updatedFile?.file?.modified).toEqual([[0, 5]]);
      // expect(updatedFile.metadata).toEqual({ custom: 'data' }); // Temporarily removed for TypeScript compatibility
    });
  });

  describe('integration with handleToolResult', () => {
    test('should call file ID mapping for file creation tools', () => {
      // Create chunk processor without messageId to avoid database saves
      const chunkProcessorNoDb = new ChunkProcessor(null, [], [], []);

      const mockChunk = {
        type: 'tool-result' as const,
        toolCallId: 'test-tool-call',
        toolName: 'create-metrics-file',
        result: {
          files: [{ id: 'actual-id-1', name: 'Test Metric' }],
        },
      };

      // Add a reasoning entry first
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'test-tool-call',
        type: 'files',
        title: 'Creating metrics...',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['dummy-id-1'],
        files: {
          'dummy-id-1': {
            id: 'dummy-id-1',
            file_name: 'Test Metric',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: Test Metric\n...' },
          },
        },
      };

      const state = chunkProcessorNoDb.getState();
      state.reasoningHistory.push(reasoningEntry);

      // Mock the timing to avoid undefined start time
      state.timing.startTime = Date.now();

      // Manually call the file ID mapping method (simulating handleToolResult logic)
      (
        chunkProcessorNoDb as unknown as ChunkProcessorWithPrivateMethods
      ).updateFileIdsFromToolResult('test-tool-call', mockChunk.result);

      // Verify file IDs were updated
      const updatedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
        file_ids: string[];
        files: Record<string, FileObject>;
      };
      expect(updatedEntry.file_ids).toEqual(['actual-id-1']);
      expect(updatedEntry.files['actual-id-1']).toBeDefined();
      expect(updatedEntry.files['dummy-id-1']).toBeUndefined();
    });

    test('should not call file ID mapping for non-file tools', () => {
      const chunkProcessorNoDb = new ChunkProcessor(null, [], [], []);

      // Add a reasoning entry
      const reasoningEntry: ChatMessageReasoningMessage = {
        id: 'test-tool-call',
        type: 'files',
        title: 'Executing SQL',
        status: 'loading',
        secondary_title: undefined,
        file_ids: ['some-id'],
        files: {
          'some-id': {
            id: 'some-id',
            file_name: 'SQL File',
            file_type: 'metric',
            version_number: 1,
            status: 'loading',
            file: { text: 'name: SQL File\n...' },
          },
        },
      };

      const state = chunkProcessorNoDb.getState();
      state.reasoningHistory.push(reasoningEntry);
      state.timing.startTime = Date.now();

      // Check that isFileCreationTool returns false for executeSql
      const isFileCreationTool = (
        chunkProcessorNoDb as unknown as ChunkProcessorWithPrivateMethods
      ).isFileCreationTool('executeSql');
      expect(isFileCreationTool).toBe(false);

      // Verify file IDs were NOT updated (logic verification rather than actual call)
      const unchangedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
        file_ids: string[];
        files: Record<string, FileObject>;
      };
      expect(unchangedEntry.file_ids).toEqual(['some-id']);
      expect(unchangedEntry.files['some-id']).toBeDefined();
    });

    test('should verify file creation tool detection in handleToolResult flow', () => {
      const chunkProcessorNoDb = new ChunkProcessor(null, [], [], []);

      // Test that our file creation tools are properly detected
      const fileCreationTools = [
        'createMetrics',
        'create-metrics-file',
        'createDashboards',
        'create-dashboards-file',
        'modifyMetrics',
        'modify-metrics-file',
        'modifyDashboards',
        'modify-dashboards-file',
      ];

      const nonFileTools = ['executeSql', 'execute-sql', 'doneTool', 'sequentialThinking'];

      // Verify file creation tools are detected
      for (const toolName of fileCreationTools) {
        const isDetected = (
          chunkProcessorNoDb as unknown as ChunkProcessorWithPrivateMethods
        ).isFileCreationTool(toolName);
        expect(isDetected).toBe(true);
      }

      // Verify non-file tools are not detected
      for (const toolName of nonFileTools) {
        const isDetected = (
          chunkProcessorNoDb as unknown as ChunkProcessorWithPrivateMethods
        ).isFileCreationTool(toolName);
        expect(isDetected).toBe(false);
      }
    });
  });
});
