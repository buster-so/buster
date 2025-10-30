import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsDelta } from './create-metrics-delta';
import type {
  CreateMetricStateFile,
  CreateMetricsContext,
  CreateMetricsState,
} from './create-metrics-tool';

vi.mock('@buster/database/queries', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    updateMessageEntries: vi.fn(),
  };
});

vi.mock('../../../../utils/streaming/optimistic-json-parser', () => ({
  OptimisticJsonParser: {
    parse: vi.fn(),
  },
  getOptimisticValue: vi.fn(),
}));

describe('createMetricsDelta', () => {
  let context: CreateMetricsContext;
  let state: CreateMetricsState;
  let updateMessageEntriesSpy: ReturnType<typeof vi.fn>;
  let OptimisticJsonParser: { parse: ReturnType<typeof vi.fn> };
  let getOptimisticValue: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const database = await import('@buster/database/queries');
    updateMessageEntriesSpy = vi.mocked(database.updateMessageEntries);

    const streaming = await import('../../../../utils/streaming/optimistic-json-parser');
    OptimisticJsonParser = streaming.OptimisticJsonParser as unknown as {
      parse: ReturnType<typeof vi.fn>;
    };
    getOptimisticValue = vi.mocked(streaming.getOptimisticValue);

    context = {
      userId: 'user-1',
      chatId: 'chat-1',
      dataSourceId: 'ds-1',
      dataSourceSyntax: 'postgresql',
      organizationId: 'org-1',
      messageId: 'msg-1',
    };

    state = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };
  });

  describe('string delta handling', () => {
    it('should accumulate string deltas', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });

      const handler = createCreateMetricsDelta(context, state);
      await handler({ inputTextDelta: '{"files":[', toolCallId: 'tool-123', messages: [] });

      expect(state.argsText).toBe('{"files":[');
      expect(OptimisticJsonParser.parse).toHaveBeenCalledWith('{"files":[');
    });

    it('should parse complete JSON and update files', async () => {
      const fileData = { name: 'Metric 1', yml_content: 'content1' };
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [fileData] },
        isComplete: true,
        extractedValues: new Map([['files', [fileData]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        // When getting from the main extracted values
        if (map instanceof Map && map.has(key)) {
          return map.get(key);
        }
        // When getting from file object entries (Map created from Object.entries)
        if (map instanceof Map) {
          const value = map.get(key);
          if (value !== undefined) return value;
        }
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);
      await handler({
        inputTextDelta: '{"files":[{"name":"Metric 1","yml_content":"content1"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      const filesAfterComplete = state.files ?? [];
      expect(filesAfterComplete).toHaveLength(1);
      expect(filesAfterComplete[0]).toMatchObject({
        file_name: 'Metric 1',
        file_type: 'metric_file',
        status: 'loading',
      });
    });

    it('should handle multiple files with streaming JSON', async () => {
      const filesData = [
        { name: 'Metric 1', yml_content: 'content1' },
        { name: 'Metric 2', yml_content: 'content2' },
      ];

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: filesData },
        isComplete: true,
        extractedValues: new Map([['files', filesData]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files' && map instanceof Map) {
          return filesData;
        }
        // For file-level data
        if (map instanceof Map) {
          const value = map.get(key);
          if (value !== undefined) return value;
        }
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);
      await handler({
        inputTextDelta: JSON.stringify({ files: filesData }),
        toolCallId: 'tool-123',
        messages: [],
      });

      expect(state.files).toHaveLength(2);
      expect(state.files?.[0]).toMatchObject({
        file_name: 'Metric 1',
        file_type: 'metric_file',
        status: 'loading',
      });
      expect(state.files?.[1]).toMatchObject({
        file_name: 'Metric 2',
        file_type: 'metric_file',
        status: 'loading',
      });
    });

    it('should update existing files when content changes', async () => {
      // First call - partial data
      vi.mocked(OptimisticJsonParser.parse).mockReturnValueOnce({
        parsed: null,
        isComplete: false,
        extractedValues: new Map([['files', [{ name: 'metric1' }]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files' && map.has('files')) {
          return [{ name: 'metric1' }];
        }
        if (key === 'name') return 'metric1';
        if (key === 'yml_content') return '';
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      // Add initial file with just name
      await handler({
        inputTextDelta: '{"files":[{"name":"metric1"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });
      expect(state.files).toBeDefined();
      expect(state.files![0]?.file?.text).toBeUndefined();

      // Second call - complete data
      vi.mocked(OptimisticJsonParser.parse).mockReturnValueOnce({
        parsed: { files: [{ name: 'metric1', yml_content: 'updated content' }] },
        isComplete: true,
        extractedValues: new Map([
          ['files', [{ name: 'metric1', yml_content: 'updated content' }]],
        ]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'metric1', yml_content: 'updated content' }];
        if (key === 'name') return 'metric1';
        if (key === 'yml_content') return 'updated content';
        return defaultValue;
      });

      // Reset args text and update with content
      state.argsText = '';
      await handler({
        inputTextDelta: '{"files":[{"name":"metric1","yml_content":"updated content"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });
      expect(state.files![0]?.file?.text).toBe('updated content');
    });

    it('should update database with progress when messageId exists', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [{ name: 'metric1', yml_content: 'content1' }] },
        isComplete: true,
        extractedValues: new Map([['files', [{ name: 'metric1', yml_content: 'content1' }]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'metric1', yml_content: 'content1' }];
        if (key === 'name') return 'metric1';
        if (key === 'yml_content') return 'content1';
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      await handler({
        inputTextDelta: '{"files":[{"name":"metric1","yml_content":"content1"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      expect(updateMessageEntriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg-1',
        })
      );
    });

    it('should handle database update errors gracefully', async () => {
      vi.mocked(updateMessageEntriesSpy).mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [{ name: 'metric1', yml_content: 'content1' }] },
        isComplete: true,
        extractedValues: new Map([['files', [{ name: 'metric1', yml_content: 'content1' }]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'metric1', yml_content: 'content1' }];
        if (key === 'name') return 'metric1';
        if (key === 'yml_content') return 'content1';
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      await handler({
        inputTextDelta: '{"files":[{"name":"metric1","yml_content":"content1"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[create-metrics] Error updating entries during delta:',
        new Error('Database error')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = { ...context, messageId: undefined };
      const handler = createCreateMetricsDelta(contextWithoutMessageId, state);

      await handler({
        inputTextDelta: '{"files":[{"name":"metric1","yml_content":"content1"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      expect(updateMessageEntriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('complete JSON handling', () => {
    it('should handle complete JSON in single delta', async () => {
      const input = {
        files: [
          { name: 'metric1', yml_content: 'content1' },
          { name: 'metric2', yml_content: 'content2' },
        ],
      };

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: input,
        isComplete: true,
        extractedValues: new Map([['files', input.files]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return input.files;
        // Handle individual file property extraction
        if (map instanceof Map) {
          const value = map.get(key);
          if (value !== undefined) return value;
        }
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      await handler({
        inputTextDelta: JSON.stringify(input),
        toolCallId: 'tool-123',
        messages: [],
      });

      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(2);
      expect(state.files![0]).toMatchObject({
        file_name: 'metric1',
        file_type: 'metric_file',
        status: 'loading',
      });
    });

    it('should handle empty files array', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [] },
        isComplete: true,
        extractedValues: new Map([['files', []]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [];
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      await handler({
        inputTextDelta: JSON.stringify({ files: [] }),
        toolCallId: 'tool-123',
        messages: [],
      });

      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });

      const handler = createCreateMetricsDelta(context, state);

      // This should not throw
      await handler({
        inputTextDelta: '{"files":[{"broken',
        toolCallId: 'tool-123',
        messages: [],
      });

      // State should be partially updated
      expect(state.argsText).toBe('{"files":[{"broken');
    });

    it('should initialize files array if undefined', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [] },
        isComplete: true,
        extractedValues: new Map([['files', []]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [];
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      // Ensure files is undefined initially
      expect(state.files).toEqual([]);

      await handler({
        inputTextDelta: '{"files":[]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      // Files should now be initialized
      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(0);
    });

    it('should handle rapid successive deltas', async () => {
      // Set up mock for multiple calls
      vi.mocked(OptimisticJsonParser.parse)
        .mockReturnValueOnce({
          parsed: null,
          isComplete: false,
          extractedValues: new Map(),
        })
        .mockReturnValueOnce({
          parsed: null,
          isComplete: false,
          extractedValues: new Map([['files', [{ name: 'partial' }]]]),
        })
        .mockReturnValueOnce({
          parsed: { files: [{ name: 'metric1', yml_content: 'content1' }] },
          isComplete: true,
          extractedValues: new Map([['files', [{ name: 'metric1', yml_content: 'content1' }]]]),
        });

      let callCount = 0;
      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        callCount++;
        if (callCount <= 2) return defaultValue;
        if (key === 'files') return [{ name: 'metric1', yml_content: 'content1' }];
        if (key === 'name') return 'metric1';
        if (key === 'yml_content') return 'content1';
        return defaultValue;
      });

      const handler = createCreateMetricsDelta(context, state);

      // Simulate rapid streaming
      await handler({
        inputTextDelta: '{"fil',
        toolCallId: 'tool-123',
        messages: [],
      });
      await handler({
        inputTextDelta: 'es":[',
        toolCallId: 'tool-123',
        messages: [],
      });
      await handler({
        inputTextDelta: '{"name":',
        toolCallId: 'tool-123',
        messages: [],
      });
      await handler({
        inputTextDelta: '"metric1",',
        toolCallId: 'tool-123',
        messages: [],
      });
      await handler({
        inputTextDelta: '"yml_content":',
        toolCallId: 'tool-123',
        messages: [],
      });
      await handler({
        inputTextDelta: '"content1"}',
        toolCallId: 'tool-123',
        messages: [],
      });
      await handler({
        inputTextDelta: ']}',
        toolCallId: 'tool-123',
        messages: [],
      });

      // Should accumulate properly
      expect(state.argsText).toBe('{"files":[{"name":"metric1","yml_content":"content1"}]}');
      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(1);
    });
  });
});
