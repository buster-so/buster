import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { describe, expect, it } from 'vitest';
import { validateArrayAccess } from '../validation-helpers';
import { ChunkProcessor } from './chunk-processor';

describe('ChunkProcessor SQL Reasoning Entry Creation', () => {
  it('should create SQL reasoning entry with statements array', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);

    // Test the createReasoningEntry method directly via reflection
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const toolCallId = 'toolu_01A1rVASAPgSy1RKXBuJBrTh';
    const args = {
      statements: [
        'SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25',
        "SELECT DISTINCT name FROM ont_ont.product_subcategory WHERE name ILIKE '%accessor%' LIMIT 25",
        'SELECT DISTINCT productline FROM ont_ont.product WHERE productline IS NOT NULL LIMIT 25',
      ],
    };

    const result = createReasoningEntry(toolCallId, 'executeSql', args);

    expect(result).toBeDefined();
    expect(result!.id).toBe(toolCallId);
    expect(result!.type).toBe('files');
    expect(result!.title).toBe('Executing SQL');
    expect(result!.status).toBe('loading');
    expect((result as any).file_ids).toHaveLength(1);

    const fileId = (result as any).file_ids?.[0] ?? '';
    expect((result as any).files?.[fileId]).toBeDefined();
    expect((result as any).files[fileId].file_name).toBe('SQL Statements');
    expect((result as any).files[fileId].file_type).toBe('agent-action');

    const expectedYaml = `statements:
  - SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25
  - SELECT DISTINCT name FROM ont_ont.product_subcategory WHERE name ILIKE '%accessor%' LIMIT 25
  - SELECT DISTINCT productline FROM ont_ont.product WHERE productline IS NOT NULL LIMIT 25`;

    expect((result as any).files[fileId].file.text).toBe(expectedYaml);
  });

  it('should handle statements as JSON string', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const toolCallId = 'toolu_01GRLdxzhgpG3YWzDP9CuU2G';
    const args = {
      statements:
        '["SELECT ps.name as subcategory_name FROM ont_ont.product_subcategory ps", "SELECT MAX(year) as max_year FROM ont_ont.product_total_revenue"]',
    };

    const result = createReasoningEntry(toolCallId, 'executeSql', args);

    expect(result).toBeDefined();
    expect(result!.type).toBe('files');

    const fileId = (result as any).file_ids?.[0] ?? '';
    const expectedYaml = `statements:
  - SELECT ps.name as subcategory_name FROM ont_ont.product_subcategory ps
  - SELECT MAX(year) as max_year FROM ont_ont.product_total_revenue`;

    expect((result as any).files[fileId].file.text).toBe(expectedYaml);
  });

  it('should handle statements as plain string', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const toolCallId = 'toolu_012vwyZV9bHefWZMqq97RFZy';
    const args = {
      statements:
        'SELECT year, quarter, COUNT(*) as record_count FROM ont_ont.product_total_revenue',
    };

    const result = createReasoningEntry(toolCallId, 'executeSql', args);

    expect(result).toBeDefined();
    expect(result!.type).toBe('files');

    const fileId = (result as any).file_ids?.[0] ?? '';
    const expectedYaml = `statements:
  - SELECT year, quarter, COUNT(*) as record_count FROM ont_ont.product_total_revenue`;

    expect((result as any).files[fileId].file.text).toBe(expectedYaml);
  });

  it('should handle legacy queries format', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const toolCallId = 'legacy-call-id';
    const args = {
      queries: ['SELECT * FROM table1', { sql: 'SELECT COUNT(*) FROM table2' }],
    };

    const result = createReasoningEntry(toolCallId, 'executeSql', args);

    expect(result).toBeDefined();
    expect(result!.type).toBe('files');

    const fileId = (result as any).file_ids?.[0] ?? '';
    const expectedYaml = `statements:
  - SELECT * FROM table1
  - SELECT COUNT(*) FROM table2`;

    expect((result as any).files[fileId].file.text).toBe(expectedYaml);
  });

  it('should handle legacy sql format', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const toolCallId = 'legacy-sql-call-id';
    const args = {
      sql: 'SELECT * FROM single_table LIMIT 10',
    };

    const result = createReasoningEntry(toolCallId, 'executeSql', args);

    expect(result).toBeDefined();
    expect(result!.type).toBe('files');

    const fileId = (result as any).file_ids?.[0] ?? '';
    const expectedYaml = `statements:
  - SELECT * FROM single_table LIMIT 10`;

    expect((result as any).files[fileId].file.text).toBe(expectedYaml);
  });

  it('should return null for non-SQL tools', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const result = createReasoningEntry('tool-id', 'otherTool', { someArg: 'value' });

    // This should create a generic text entry, not null, but SQL-specific logic shouldn't apply
    expect(result).toBeDefined();
    expect(result!.type).toBe('text'); // Generic tool creates text entry
  });

  it('should return null for invalid SQL args', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const result = createReasoningEntry('tool-id', 'executeSql', { invalidArg: 'value' });

    expect(result).toBeNull();
  });

  it('should handle malformed JSON in statements string gracefully', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);

    const toolCallId = 'malformed-json-call';
    const args = {
      statements: '["SELECT * FROM table1", "incomplete json',
    };

    const result = createReasoningEntry(toolCallId, 'executeSql', args);

    expect(result).toBeDefined();
    expect(result!.type).toBe('files');

    const fileId = (result as any).file_ids?.[0] ?? '';
    // Should treat the whole string as a single statement when JSON parsing fails
    const expectedYaml = `statements:
  - ["SELECT * FROM table1", "incomplete json`;

    expect((result as any).files[fileId].file.text).toBe(expectedYaml);
  });
});

describe('ChunkProcessor SQL Results Integration', () => {
  it('should update SQL file with results after tool completion', () => {
    const chunkProcessor = new ChunkProcessor(null, [], [], []);

    // Create initial SQL reasoning entry
    const createReasoningEntry = (
      chunkProcessor as unknown as {
        createReasoningEntry: (
          toolCallId: string,
          toolName: string,
          args: unknown
        ) => ChatMessageReasoningMessage | null;
      }
    ).createReasoningEntry.bind(chunkProcessor);
    const toolCallId = 'sql-with-results';
    const args = {
      statements: [
        'SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25',
        'SELECT COUNT(*) FROM ont_ont.invalid_table',
      ],
    };

    const initialEntry = createReasoningEntry(toolCallId, 'executeSql', args);

    // Add to reasoning history
    const reasoningHistory = (
      chunkProcessor as unknown as {
        state: { reasoningHistory: ChatMessageReasoningMessage[] };
      }
    ).state.reasoningHistory;
    reasoningHistory.push(initialEntry!);

    // Simulate tool result with mixed success/error results
    const toolResult = {
      results: [
        {
          sql: 'SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25',
          status: 'success',
          results: [
            { name: 'Bikes' },
            { name: 'Accessories' },
            { name: 'Clothing' },
            { name: 'Components' },
          ],
        },
        {
          sql: 'SELECT COUNT(*) FROM ont_ont.invalid_table',
          status: 'error',
          error_message: 'PostgreSQL query failed: relation "ont_ont.invalid_table" does not exist',
        },
      ],
    };

    // Call the updateSqlFileWithResults method
    const updateSqlFileWithResults = (
      chunkProcessor as unknown as {
        updateSqlFileWithResults: (toolCallId: string, toolResult: unknown) => void;
      }
    ).updateSqlFileWithResults.bind(chunkProcessor);
    updateSqlFileWithResults(toolCallId, toolResult);

    // Verify the file content was updated with results
    const updatedEntry = validateArrayAccess(
      reasoningHistory,
      0,
      'reasoning history'
    ) as ChatMessageReasoningMessage;
    const fileId = (updatedEntry as any).file_ids?.[0] ?? '';
    const fileContent = (updatedEntry as any).files?.[fileId]?.file?.text ?? '';

    const expectedContent = `statements:
  - SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25
  - SELECT COUNT(*) FROM ont_ont.invalid_table

results:
  - status: success
    sql: SELECT DISTINCT name FROM ont_ont.product_category LIMIT 25
    results:
      -
        name: Bikes
      -
        name: Accessories
      -
        name: Clothing
      -
        name: Components
  - status: error
    sql: SELECT COUNT(*) FROM ont_ont.invalid_table
    error_message: |-
      PostgreSQL query failed: relation "ont_ont.invalid_table" does not exist`;

    expect(fileContent).toBe(expectedContent);
  });
});
