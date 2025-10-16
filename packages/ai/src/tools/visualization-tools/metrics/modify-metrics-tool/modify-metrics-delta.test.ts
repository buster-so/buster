import { updateMessageEntries } from '@buster/database/queries';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsDelta } from './modify-metrics-delta';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database/queries', () => ({
  updateMessageEntries: vi.fn(),
}));

// Import the module for mocking
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../../utils/streaming/optimistic-json-parser';

// Mock the optimistic JSON parser
vi.mock('../../../../utils/streaming/optimistic-json-parser', () => ({
  OptimisticJsonParser: {
    parse: vi.fn(),
  },
  getOptimisticValue: vi.fn(),
}));

describe('createModifyMetricsDelta', () => {
  let state: ModifyMetricsState;
  let context: {
    messageId?: string;
    userId: string;
    chatId: string;
    dataSourceId: string;
    dataSourceSyntax: string;
    organizationId: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
      messageId: 'msg-123',
    };
  });

  describe('string delta handling', () => {
    it('should accumulate string deltas in argsText', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: '{"files":[', toolCallId: 'tool-123', messages: [] });

      expect(state.argsText).toBe('{"files":[');
      expect(OptimisticJsonParser.parse).toHaveBeenCalledWith('{"files":[');
    });

    it('should update parsedArgs when JSON is parsed', async () => {
      const parsedData = { files: [{ id: 'metric-1', yml_content: 'content' }] };
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: parsedData,
        isComplete: true,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'complete json', toolCallId: 'tool-123', messages: [] });

      // State should have accumulated the parsed data in argsText
      expect(state.argsText).toBe('complete json');
    });

    it('should update state files from parsed array', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([
        { id: 'metric-1', yml_content: 'content1', name: 'Metric 1' },
        { id: 'metric-2', yml_content: 'content2' },
      ]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(state.files).toHaveLength(2);
      expect(state.files![0]).toMatchObject({
        id: 'metric-1',
        yml_content: 'content1',
        status: 'loading',
        file_type: 'metric_file',
        version_number: 1,
      });
      expect(state.files![1]).toMatchObject({
        id: 'metric-2',
        yml_content: 'content2',
        status: 'loading',
        file_type: 'metric_file',
        version_number: 1,
      });
    });

    it('should update existing files in state', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../../utils/streaming/optimistic-json-parser'
      );

      // Pre-populate state with a file
      state.files = [
        {
          id: 'metric-1',
          yml_content: '',
          status: 'loading',
          file_type: 'metric_file',
          version_number: 1,
        },
      ];

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([
        { id: 'metric-1', yml_content: 'updated content', name: 'Updated Name' },
      ]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(state.files![0]).toMatchObject({
        id: 'metric-1',
        yml_content: 'updated content',
        status: 'loading',
        file_type: 'metric_file',
        version_number: 1,
      });
    });

    it('should handle partial file data', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });

      // First delta with just ID
      vi.mocked(getOptimisticValue).mockReturnValue([{ id: 'metric-1' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta1', toolCallId: 'tool-123', messages: [] });

      expect(state.files![0]).toMatchObject({
        id: 'metric-1',
        status: 'loading',
        file_type: 'metric_file',
        version_number: 1,
      });
    });

    it('should update database when messageId and toolCallId exist', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'msg-123',
        reasoningMessages: [expect.any(Object)],
        rawLlmMessages: [expect.any(Object)],
      });
    });

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = { ...context };
      delete contextWithoutMessageId.messageId;

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(contextWithoutMessageId, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should filter undefined entries before creating reasoning message', async () => {
      // State with undefined entries and valid files with proper structure
      state.files = [
        undefined as any,
        {
          id: 'metric-1',
          yml_content: 'content',
          file: { text: 'content' },
          file_type: 'metric_file',
          version_number: 1,
          status: 'loading',
        },
        undefined as any,
        {
          id: 'metric-2',
          yml_content: 'content2',
          file: { text: 'content2' },
          file_type: 'metric_file',
          version_number: 1,
          status: 'loading',
        },
      ];

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue(undefined);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      // The database update should be called with valid files
      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'msg-123',
        reasoningMessages: [expect.any(Object)],
        rawLlmMessages: [expect.any(Object)],
      });
    });

    it('should handle database update errors gracefully', async () => {
      (updateMessageEntries as any).mockRejectedValue(new Error('Database error'));

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);

      // Should not throw
      await expect(
        deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] })
      ).resolves.not.toThrow();

      // State should still be updated
      expect(state.files).toHaveLength(1);
    });
  });

  describe('object delta handling', () => {
    it('should handle complete object delta', async () => {
      const delta: Partial<ModifyMetricsInput> = {
        files: [
          { id: 'metric-1', yml_content: 'content1' },
          { id: 'metric-2', yml_content: 'content2' },
        ],
      };

      // Mock the parse to return the files in extractedValues
      const extractedValues = new Map();
      extractedValues.set('files', delta.files);

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: delta,
        isComplete: true,
        extractedValues,
      });

      // Mock getOptimisticValue to return the files
      vi.mocked(getOptimisticValue).mockImplementation((map, key) => {
        if (key === 'files') return delta.files;
        return undefined;
      });

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({
        inputTextDelta: JSON.stringify(delta),
        toolCallId: 'tool-123',
        messages: [],
      });

      // State should have accumulated the JSON string
      expect(state.argsText).toBe(JSON.stringify(delta));
      expect(state.files).toHaveLength(2);
      expect(state.files![0]).toMatchObject({
        id: 'metric-1',
        yml_content: 'content1',
        status: 'loading',
        file_type: 'metric_file',
        version_number: 1,
      });
    });

    it('should handle empty object delta', async () => {
      const delta: Partial<ModifyMetricsInput> = {};

      // Mock the parse to return empty extractedValues
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: delta,
        isComplete: true,
        extractedValues: new Map(),
      });

      vi.mocked(getOptimisticValue).mockReturnValue(undefined);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({
        inputTextDelta: JSON.stringify(delta),
        toolCallId: 'tool-123',
        messages: [],
      });

      // State should have accumulated the empty JSON
      expect(state.argsText).toBe('{}');
      // Since there's no files property, state.files should remain as initialized (empty array)
      expect(state.files).toEqual([]);
    });
  });

  describe('logging', () => {
    it('should not log information during delta processing', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      vi.mocked(getOptimisticValue).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      // The implementation doesn't log info messages during delta processing
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
