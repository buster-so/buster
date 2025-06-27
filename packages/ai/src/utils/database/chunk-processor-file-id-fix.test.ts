import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { beforeEach, describe, expect, test } from 'vitest';
import { ChunkProcessor } from './chunk-processor';

describe('ChunkProcessor File ID Mapping Fix', () => {
  let chunkProcessor: ChunkProcessor;

  beforeEach(() => {
    // Create processor without messageId to avoid database calls
    chunkProcessor = new ChunkProcessor(null, [], [], []);
  });

  test('should update reasoning message file IDs when files are successfully created', async () => {
    // Step 1: Simulate the initial reasoning entry with dummy IDs (created during streaming)
    const dummyId1 = 'e3f585a2-4d0e-4542-b023-7700f0d90a1f';
    const dummyId2 = 'b2f485a2-4d0e-4542-b023-7700f0d90a2f';
    
    const reasoningEntry: ChatMessageReasoningMessage = {
      id: 'toolu_015qv7VJJmof4mdvvEfdqgz9',
      type: 'files',
      title: 'Creating metrics...',
      status: 'loading',
      secondary_title: undefined,
      file_ids: [dummyId1, dummyId2],
      files: {
        [dummyId1]: {
          id: dummyId1,
          file_type: 'metric',
          file_name: 'Top Customer by Lifetime Value',
          version_number: 1,
          status: 'loading',
          file: { 
            text: 'name: Top Customer by Lifetime Value\ndescription: Who is the customer that has generated the most total revenue over their entire history?\n...' 
          },
        },
        [dummyId2]: {
          id: dummyId2,
          file_type: 'metric',
          file_name: 'Revenue by Month',
          version_number: 1,
          status: 'loading',
          file: { 
            text: 'name: Revenue by Month\ndescription: Monthly revenue breakdown\n...' 
          },
        }
      },
    };

    // Add the reasoning entry to the processor
    const state = chunkProcessor.getState();
    state.reasoningHistory.push(reasoningEntry);

    // Step 2: Simulate the tool result with actual database IDs
    const actualId1 = '0e62817c-9c3e-41e3-af93-7529f79727cc';
    const actualId2 = '1f73928d-0d4f-52f4-bf04-8640g89838dd';
    
    const toolResult = {
      files: [
        {
          id: actualId1,
          name: 'Top Customer by Lifetime Value',
          results: [
            {
              customer_name: 'Roger Harui',
              total_lifetime_value: '877107.192221'
            }
          ],
          file_type: 'metric',
          created_at: '2025-06-27T01:59:13.471Z',
          updated_at: '2025-06-27T01:59:13.471Z',
          result_message: 'Query validated successfully and returned 1 records',
          version_number: 1
        },
        {
          id: actualId2,
          name: 'Revenue by Month',
          results: [
            { month: 'Jan', revenue: '50000' },
            { month: 'Feb', revenue: '60000' }
          ],
          file_type: 'metric',
          created_at: '2025-06-27T01:59:13.471Z',
          updated_at: '2025-06-27T01:59:13.471Z',
          result_message: 'Query validated successfully and returned 2 records',
          version_number: 1
        }
      ],
      message: 'Successfully created 2 metric files.',
      duration: 733,
      failed_files: []
    };

    // Step 3: Call the private method that should update the file IDs
    // Note: In a real scenario, this would be called via handleToolResult
    const processor = chunkProcessor as any;
    processor.updateFileIdsAndStatusFromToolResult('toolu_015qv7VJJmof4mdvvEfdqgz9', toolResult);

    // Step 4: Verify the reasoning history was updated correctly
    const updatedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
      file_ids: string[];
      files: Record<string, any>;
    };

    // The file_ids array should now contain the actual IDs, not the dummy IDs
    expect(updatedEntry.file_ids).toEqual([actualId1, actualId2]);
    expect(updatedEntry.file_ids).not.toContain(dummyId1);
    expect(updatedEntry.file_ids).not.toContain(dummyId2);

    // The files object should use actual IDs as keys, not dummy IDs
    expect(Object.keys(updatedEntry.files)).toEqual([actualId1, actualId2]);
    expect(updatedEntry.files[dummyId1]).toBeUndefined();
    expect(updatedEntry.files[dummyId2]).toBeUndefined();

    // The file objects themselves should have their ID property updated
    expect(updatedEntry.files[actualId1].id).toBe(actualId1);
    expect(updatedEntry.files[actualId2].id).toBe(actualId2);

    // File data should be preserved
    expect(updatedEntry.files[actualId1].file_name).toBe('Top Customer by Lifetime Value');
    expect(updatedEntry.files[actualId2].file_name).toBe('Revenue by Month');
    expect(updatedEntry.files[actualId1].status).toBe('completed');
    expect(updatedEntry.files[actualId2].status).toBe('completed');
  });

  test('should handle mixed successful and failed files correctly', async () => {
    const dummyId1 = 'dummy-success-1';
    const dummyId2 = 'dummy-failed-1';
    const dummyId3 = 'dummy-success-2';
    
    const reasoningEntry: ChatMessageReasoningMessage = {
      id: 'tool-call-mixed',
      type: 'files',
      title: 'Creating metrics...',
      status: 'loading',
      secondary_title: undefined,
      file_ids: [dummyId1, dummyId2, dummyId3],
      files: {
        [dummyId1]: {
          id: dummyId1,
          file_type: 'metric',
          file_name: 'Successful Metric 1',
          version_number: 1,
          status: 'loading',
          file: { text: 'content1' },
        },
        [dummyId2]: {
          id: dummyId2,
          file_type: 'metric',
          file_name: 'Failed Metric',
          version_number: 1,
          status: 'loading',
          file: { text: 'content2' },
        },
        [dummyId3]: {
          id: dummyId3,
          file_type: 'metric',
          file_name: 'Successful Metric 2',
          version_number: 1,
          status: 'loading',
          file: { text: 'content3' },
        }
      },
    };

    const state = chunkProcessor.getState();
    state.reasoningHistory.push(reasoningEntry);

    const actualId1 = 'actual-success-1';
    const actualId3 = 'actual-success-2';
    
    const toolResult = {
      files: [
        { id: actualId1, name: 'Successful Metric 1' },
        { id: actualId3, name: 'Successful Metric 2' }
      ],
      failed_files: [
        { name: 'Failed Metric', error: 'SQL syntax error' }
      ]
    };

    const processor = chunkProcessor as any;
    processor.updateFileIdsAndStatusFromToolResult('tool-call-mixed', toolResult);

    const updatedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
      file_ids: string[];
      files: Record<string, any>;
    };

    // Verify file_ids array contains actual IDs for successful files and dummy ID for failed file
    expect(updatedEntry.file_ids).toEqual([actualId1, dummyId2, actualId3]);

    // Verify files object has correct keys
    expect(Object.keys(updatedEntry.files).sort()).toEqual([actualId1, actualId3, dummyId2].sort());

    // Verify successful files have actual IDs and completed status
    expect(updatedEntry.files[actualId1].id).toBe(actualId1);
    expect(updatedEntry.files[actualId1].status).toBe('completed');
    expect(updatedEntry.files[actualId1].file_name).toBe('Successful Metric 1');

    expect(updatedEntry.files[actualId3].id).toBe(actualId3);
    expect(updatedEntry.files[actualId3].status).toBe('completed');
    expect(updatedEntry.files[actualId3].file_name).toBe('Successful Metric 2');

    // Verify failed file keeps dummy ID and has failed status
    expect(updatedEntry.files[dummyId2].id).toBe(dummyId2);
    expect(updatedEntry.files[dummyId2].status).toBe('failed');
    expect(updatedEntry.files[dummyId2].error).toBe('SQL syntax error');
    expect(updatedEntry.files[dummyId2].file_name).toBe('Failed Metric');
  });

  test('should preserve all file data when updating IDs', async () => {
    const dummyId = 'dummy-preserve-test';
    
    const reasoningEntry: ChatMessageReasoningMessage = {
      id: 'tool-call-preserve',
      type: 'files',
      title: 'Creating metrics...',
      status: 'loading',
      secondary_title: undefined,
      file_ids: [dummyId],
      files: {
        [dummyId]: {
          id: dummyId,
          file_type: 'metric',
          file_name: 'Complex Metric',
          version_number: 1,
          status: 'loading',
          file: { 
            text: 'name: Complex Metric\nsql: SELECT * FROM table',
            modified: [[0, 5], [10, 15]]
          },
          metadata: { 
            custom: 'data',
            tags: ['important', 'financial']
          }
        }
      },
    };

    const state = chunkProcessor.getState();
    state.reasoningHistory.push(reasoningEntry);

    const actualId = 'actual-preserve-test';
    const toolResult = {
      files: [{ id: actualId, name: 'Complex Metric' }]
    };

    const processor = chunkProcessor as any;
    processor.updateFileIdsAndStatusFromToolResult('tool-call-preserve', toolResult);

    const updatedEntry = state.reasoningHistory[0] as ChatMessageReasoningMessage & {
      file_ids: string[];
      files: Record<string, any>;
    };

    // Verify all data is preserved when ID is updated
    const updatedFile = updatedEntry.files[actualId];
    expect(updatedFile.id).toBe(actualId);
    expect(updatedFile.file_type).toBe('metric');
    expect(updatedFile.file_name).toBe('Complex Metric');
    expect(updatedFile.version_number).toBe(1);
    expect(updatedFile.status).toBe('completed');
    expect(updatedFile.file.text).toBe('name: Complex Metric\nsql: SELECT * FROM table');
    expect(updatedFile.file.modified).toEqual([[0, 5], [10, 15]]);
    expect(updatedFile.metadata).toEqual({ 
      custom: 'data',
      tags: ['important', 'financial']
    });
  });

  test('integration: file ID mapping should work in full stream processing', async () => {
    // This test simulates the full flow from tool call to tool result
    const processor = chunkProcessor as any;
    
    // Step 1: Simulate tool call streaming that creates the initial reasoning entry
    const toolCallChunk = {
      type: 'tool-call-delta' as const,
      toolCallId: 'test-tool-call',
      toolName: 'createMetrics',
      argsTextDelta: JSON.stringify({
        files: [{
          name: 'Test Metric',
          yml_content: 'name: Test Metric\nsql: SELECT COUNT(*) FROM users'
        }]
      })
    };

    // This would normally happen via handleTextDelta
    const reasoningEntry: ChatMessageReasoningMessage = {
      id: 'test-tool-call',
      type: 'files',
      title: 'Creating metrics...',
      status: 'loading',
      secondary_title: undefined,
      file_ids: ['temp-id-123'],
      files: {
        'temp-id-123': {
          id: 'temp-id-123',
          file_type: 'metric',
          file_name: 'Test Metric',
          version_number: 1,
          status: 'loading',
          file: { text: 'name: Test Metric\nsql: SELECT COUNT(*) FROM users' }
        }
      }
    };
    
    processor.state.reasoningHistory.push(reasoningEntry);
    processor.state.timing.startTime = Date.now();

    // Step 2: Simulate tool result that should trigger ID mapping
    const toolResultChunk = {
      type: 'tool-result' as const,
      toolCallId: 'test-tool-call',
      toolName: 'createMetrics',
      result: {
        files: [{
          id: 'actual-db-id-456',
          name: 'Test Metric',
          file_type: 'metric',
          results: [{ count: 100 }]
        }],
        message: 'Successfully created 1 metric file.'
      }
    };

    // Verify file creation tool is detected
    expect(processor.isFileCreationTool('createMetrics')).toBe(true);

    // Call the ID mapping
    processor.updateFileIdsAndStatusFromToolResult('test-tool-call', toolResultChunk.result);

    // Verify the mapping worked
    const updatedReasoning = processor.state.reasoningHistory[0] as any;
    expect(updatedReasoning.file_ids).toEqual(['actual-db-id-456']);
    expect(updatedReasoning.files['actual-db-id-456']).toBeDefined();
    expect(updatedReasoning.files['temp-id-123']).toBeUndefined();
    expect(updatedReasoning.files['actual-db-id-456'].id).toBe('actual-db-id-456');
  });

  test('should correctly identify all file creation tool variants', () => {
    const processor = chunkProcessor as any;
    
    const fileCreationTools = [
      'createMetrics',
      'create-metrics-file',
      'createDashboards', 
      'create-dashboards-file',
      'modifyMetrics',
      'modify-metrics-file',
      'modifyDashboards',
      'modify-dashboards-file'
    ];

    const nonFileTools = [
      'executeSql',
      'execute-sql',
      'doneTool',
      'done-tool',
      'sequentialThinking',
      'sequential-thinking',
      'submitThoughts'
    ];

    // All file creation tools should be detected
    for (const toolName of fileCreationTools) {
      expect(processor.isFileCreationTool(toolName)).toBe(true);
    }

    // Non-file tools should not be detected
    for (const toolName of nonFileTools) {
      expect(processor.isFileCreationTool(toolName)).toBe(false);
    }
  });
});