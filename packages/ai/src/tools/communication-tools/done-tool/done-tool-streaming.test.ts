import type { ModelMessage, ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

const queriesMock = vi.hoisted(() => {
  let sequence = 0;

  const updateMessageEntries = vi.fn(async () => ({
    success: true,
    sequenceNumber: sequence++,
    skipped: false as const,
  }));
  const waitForPendingUpdates = vi.fn().mockResolvedValue(undefined);
  const isMessageUpdateQueueClosed = vi.fn().mockReturnValue(false);
  const updateMessage = vi.fn().mockResolvedValue({ success: true });
  const updateChat = vi.fn().mockResolvedValue({ success: true });
  const getAssetLatestVersion = vi.fn().mockResolvedValue(1);

  return {
    updateMessageEntries,
    waitForPendingUpdates,
    isMessageUpdateQueueClosed,
    updateMessage,
    updateChat,
    getAssetLatestVersion,
    reset() {
      sequence = 0;
      updateMessageEntries.mockClear();
      waitForPendingUpdates.mockClear();
      isMessageUpdateQueueClosed.mockClear();
      updateMessage.mockClear();
      updateChat.mockClear();
      getAssetLatestVersion.mockClear();
      waitForPendingUpdates.mockResolvedValue(undefined);
      isMessageUpdateQueueClosed.mockReturnValue(false);
      getAssetLatestVersion.mockResolvedValue(1);
    },
  };
});

vi.mock('@buster/database/queries', async () => {
  const actual = await vi.importActual<typeof import('@buster/database/queries')>(
    '@buster/database/queries'
  );

  return {
    ...actual,
    updateMessageEntries: queriesMock.updateMessageEntries,
    waitForPendingUpdates: queriesMock.waitForPendingUpdates,
    isMessageUpdateQueueClosed: queriesMock.isMessageUpdateQueueClosed,
    updateMessage: queriesMock.updateMessage,
    updateChat: queriesMock.updateChat,
    getAssetLatestVersion: queriesMock.getAssetLatestVersion,
  };
});

beforeEach(() => {
  queriesMock.reset();
});

describe('Done Tool Streaming Tests', () => {
  const mockContext: DoneToolContext = {
    messageId: 'test-message-id-123',
    chatId: 'test-chat-id-456',
    workflowStartTime: Date.now(),
  };

  // Helper to create mock ToolCallOptions
  const createMockToolCallOptions = (
    overrides: Partial<ToolCallOptions> = {}
  ): ToolCallOptions => ({
    messages: [],
    toolCallId: 'test-call-id',
    ...overrides,
  });

  describe('createDoneToolStart', () => {
    test('should initialize state with entry_id on start', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-123',
        messages: [],
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle start with messages containing file tool calls', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);

      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'file-tool-123',
              toolName: 'create-metrics-file',
              input: {
                files: [{ name: 'test.yml', yml_content: 'test content' }],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'file-tool-123',
              toolName: 'create-metrics-file',
              output: {
                type: 'json',
                value: [
                  {
                    id: 'file-123',
                    name: 'test.yml',
                    file_type: 'metric_file',
                    yml_content: 'test content',
                  },
                ],
              },
            },
          ],
        },
      ];

      const options: ToolCallOptions & { messages?: ModelMessage[] } = {
        toolCallId: 'tool-call-123',
        messages: messages,
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle start without messages', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-456',
        messages: [],
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-456');
    });

    test('should handle context without messageId', async () => {
      const contextWithoutMessageId: DoneToolContext = {
        messageId: '',
        chatId: 'test-chat-id-456',
        workflowStartTime: Date.now(),
      };
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(contextWithoutMessageId, state);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-789',
        messages: [],
      };

      await expect(startHandler(options)).resolves.not.toThrow();
      expect(state.toolCallId).toBe('tool-call-789');
    });

    test('should prefer report_file for mostRecent and not create report file responses', async () => {
      vi.clearAllMocks();

      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
        addedAssetIds: [],
        addedAssets: [],
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);

      const reportId = 'report-1';
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'tc-report',
              toolName: CREATE_REPORTS_TOOL_NAME,
              input: { files: [{ content: 'report content' }] },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'tc-report',
              toolName: CREATE_REPORTS_TOOL_NAME,
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: reportId,
                      name: 'Quarterly Report',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      await startHandler({ toolCallId: 'call-1', messages });

      // Now call delta with the asset data and final response
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: reportId,
            assetName: 'Quarterly Report',
            assetType: 'report_file',
          },
        ],
        finalResponse: 'Report created successfully',
      });
      await deltaHandler({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'call-1' }),
      });

      const queries = await import('@buster/database/queries');

      // mostRecent should be set to the report
      expect(queries.updateChat).toHaveBeenCalled();
      const updateArgs = ((queries.updateChat as unknown as { mock: { calls: unknown[][] } }).mock
        .calls?.[0]?.[1] || {}) as Record<string, unknown>;
      expect(updateArgs).toMatchObject({
        mostRecentFileId: reportId,
        mostRecentFileType: 'report_file',
        mostRecentVersionNumber: 1,
      });

      // No file response messages should be created for report-only case
      const fileResponseCallWithFiles = (
        queries.updateMessageEntries as unknown as { mock: { calls: [Record<string, any>][] } }
      ).mock.calls.find(
        (c) =>
          Array.isArray((c[0] as { responseMessages?: unknown[] }).responseMessages) &&
          ((c[0] as { responseMessages?: { type?: string }[] }).responseMessages || []).some(
            (m) => m?.type === 'file'
          )
      );
      expect(fileResponseCallWithFiles).toBeUndefined();
    });

    test('should create non-report file responses but set mostRecent to report when both exist', async () => {
      vi.clearAllMocks();

      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
        addedAssetIds: [],
        addedAssets: [],
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);

      const reportId = 'report-2';
      const metricId = 'metric-1';

      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'tc-report',
              toolName: CREATE_REPORTS_TOOL_NAME,
              input: { files: [{ content: 'report content' }] },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'tc-report',
              toolName: CREATE_REPORTS_TOOL_NAME,
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: reportId,
                      name: 'Key Metrics Report',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'tc-metric',
              toolName: CREATE_METRICS_TOOL_NAME,
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Revenue',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      await startHandler({ toolCallId: 'call-2', messages });

      // Now call delta with the asset data and final response
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: reportId,
            assetName: 'Key Metrics Report',
            assetType: 'report_file',
          },
          {
            assetId: metricId,
            assetName: 'Revenue',
            assetType: 'metric_file',
          },
        ],
        finalResponse: 'Report and metrics created successfully',
      });
      await deltaHandler({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'call-2' }),
      });

      const queries = await import('@buster/database/queries');

      // mostRecent should prefer the report (first asset returned)
      const updateArgs = ((queries.updateChat as unknown as { mock: { calls: unknown[][] } }).mock
        .calls?.[0]?.[1] || {}) as Record<string, unknown>;
      expect(updateArgs).toMatchObject({
        mostRecentFileId: reportId,
        mostRecentFileType: 'report_file',
      });

      // Response messages should include both files
      const fileResponseCall = (
        queries.updateMessageEntries as unknown as { mock: { calls: [Record<string, any>][] } }
      ).mock.calls.find(
        (c) =>
          Array.isArray((c[0] as { responseMessages?: unknown[] }).responseMessages) &&
          ((c[0] as { responseMessages?: { type?: string }[] }).responseMessages || []).some(
            (m) => m?.type === 'file'
          )
      );

      expect(fileResponseCall).toBeDefined();
      const responseMessages = (
        fileResponseCall?.[0] as { responseMessages?: Record<string, any>[] }
      )?.responseMessages as Record<string, any>[];
      const metricResponse = responseMessages?.find((m) => m.id === metricId);
      expect(metricResponse).toBeDefined();
      expect(metricResponse?.file_type).toBe('metric_file');
    });

    test('should fall back to first non-report file when no report exists', async () => {
      vi.clearAllMocks();

      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
        addedAssetIds: [],
        addedAssets: [],
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);

      const dashboardId = 'dash-1';
      const metricId = 'metric-2';

      const messages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'tc-dash',
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: dashboardId,
                      name: 'Sales Dashboard',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'tc-metric2',
              toolName: CREATE_METRICS_TOOL_NAME,
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Margin',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      await startHandler({ toolCallId: 'call-3', messages });

      // Now call delta with the asset data and final response
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: dashboardId,
            assetName: 'Sales Dashboard',
            assetType: 'dashboard_file',
          },
          {
            assetId: metricId,
            assetName: 'Margin',
            assetType: 'metric_file',
          },
        ],
        finalResponse: 'Dashboard and metrics created successfully',
      });
      await deltaHandler({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'call-3' }),
      });

      const queries = await import('@buster/database/queries');
      const updateArgs = ((queries.updateChat as unknown as { mock: { calls: unknown[][] } }).mock
        .calls[0]?.[1] || {}) as Record<string, unknown>;

      // Should fall back to the first available (dashboard here)
      expect(updateArgs).toMatchObject({
        mostRecentFileId: dashboardId,
        mostRecentFileType: 'dashboard_file',
      });
    });
  });

  describe('createDoneToolDelta', () => {
    test('should accumulate text deltas to args', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"finalR',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"finalR');

      await deltaHandler({
        inputTextDelta: 'esponse": "Hello',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"finalResponse": "Hello');
    });

    test('should extract partial finalResponse from incomplete JSON', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"finalResponse": "This is a partial response that is still being',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"finalResponse": "This is a partial response that is still being');
      expect(state.finalResponse).toBe('This is a partial response that is still being');
    });

    test('should handle complete JSON in delta', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"finalResponse": "Complete response message"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"finalResponse": "Complete response message"}');
      expect(state.finalResponse).toBe('Complete response message');
    });

    test('should handle markdown content in finalResponse', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      const markdownContent = `## Summary

- Point 1
- Point 2

**Bold text**`;
      const jsonInput = JSON.stringify({ finalResponse: markdownContent });
      await deltaHandler({
        inputTextDelta: jsonInput,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.finalResponse).toBe(markdownContent);
    });

    test('should handle escaped characters in JSON', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"finalResponse": "Line 1\\nLine 2\\n\\"Quoted text\\""}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.finalResponse).toBe('Line 1\nLine 2\n"Quoted text"');
    });

    test('should not update state when no finalResponse is extracted', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"other_field": "value"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"other_field": "value"}');
      expect(state.finalResponse).toBeUndefined();
    });

    test('should handle empty finalResponse gracefully', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"finalResponse": ""}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"finalResponse": ""}');
      expect(state.finalResponse).toBeUndefined();
    });

    test('should ignore deltas after execute begins', async () => {
      vi.clearAllMocks();
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: 'Complete response',
        isFinalizing: true,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      await deltaHandler({
        inputTextDelta: '{"finalResponse": "Stale"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      const queries = await import('@buster/database/queries');
      expect(queries.updateMessageEntries).not.toHaveBeenCalled();
      expect(state.args).toBe('');
      expect(state.finalResponse).toBe('Complete response');
    });
  });

  describe('createDoneToolFinish', () => {
    test('should update state with final input on finish', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '{"finalResponse": "Final message"}',
        finalResponse: 'Final message',
      };

      const finishHandler = createDoneToolFinish(mockContext, state);

      const input: DoneToolInput = {
        assetsToReturn: [],
        finalResponse: 'This is the final response message',
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle finish without prior entry_id', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const finishHandler = createDoneToolFinish(mockContext, state);

      const input: DoneToolInput = {
        assetsToReturn: [],
        finalResponse: 'Response without prior start',
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-456',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-456');
    });

    test('should handle markdown formatted final response', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const finishHandler = createDoneToolFinish(mockContext, state);

      const markdownResponse = `
## Analysis Complete

The following items were processed:
- Item 1: Successfully analyzed
- Item 2: Completed with warnings
- Item 3: **Failed** - requires attention

### Next Steps
1. Review the failed items
2. Update configuration
3. Re-run the analysis
`;

      const input: DoneToolInput = {
        assetsToReturn: [],
        finalResponse: markdownResponse,
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-789',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-789');
    });
  });

  describe('Type Safety Tests', () => {
    test('should enforce DoneToolContext type requirements', () => {
      const validContext: DoneToolContext = {
        messageId: 'message-123',
        chatId: 'test-chat-id-456',
        workflowStartTime: Date.now(),
      };

      const extendedContext = {
        messageId: 'message-456',
        chatId: 'test-chat-id-456',
        workflowStartTime: Date.now(),
        additionalField: 'extra-data',
      };

      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const handler1 = createDoneToolStart(validContext, state);
      const handler2 = createDoneToolStart(extendedContext, state);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });

    test('should maintain state type consistency through streaming lifecycle', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);
      const finishHandler = createDoneToolFinish(mockContext, state);

      await startHandler({ toolCallId: 'test-123', messages: [] });
      expect(state.toolCallId).toBeTypeOf('string');

      await deltaHandler({
        inputTextDelta: '{"finalResponse": "Testing"}',
        toolCallId: 'test-123',
        messages: [],
      });
      expect(state.args).toBeTypeOf('string');
      expect(state.finalResponse).toBeTypeOf('string');

      const input: DoneToolInput = {
        assetsToReturn: [],
        finalResponse: 'Final test',
      };
      await finishHandler({ input, toolCallId: 'test-123', messages: [] });
      expect(state.toolCallId).toBeTypeOf('string');
    });
  });

  describe('Streaming Flow Integration', () => {
    test('should handle complete streaming flow from start to finish', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(mockContext, state);
      const deltaHandler = createDoneToolDelta(mockContext, state);
      const finishHandler = createDoneToolFinish(mockContext, state);

      const toolCallId = 'streaming-test-123';

      await startHandler({ toolCallId, messages: [] });
      expect(state.toolCallId).toBe(toolCallId);

      const chunks = [
        '{"finalR',
        'esponse": "This ',
        'is a streaming ',
        'response that comes ',
        'in multiple chunks',
        '"}',
      ];

      for (const chunk of chunks) {
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId,
          messages: [],
        });
      }

      expect(state.args).toBe(
        '{"finalResponse": "This is a streaming response that comes in multiple chunks"}'
      );
      expect(state.finalResponse).toBe(
        'This is a streaming response that comes in multiple chunks'
      );

      const input: DoneToolInput = {
        assetsToReturn: [],
        finalResponse: 'This is a streaming response that comes in multiple chunks',
      };
      await finishHandler({ input, toolCallId, messages: [] });

      expect(state.toolCallId).toBe(toolCallId);
    });

    test('should handle streaming with special characters and formatting', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(mockContext, state);

      const chunks = [
        '{"finalResponse": "',
        '## Results\\n\\n',
        '- Success: 90%\\n',
        '- Failed: 10%\\n\\n',
        '**Note:** Review failed items',
        '"}',
      ];

      let accumulated = '';
      for (const chunk of chunks) {
        accumulated += chunk;
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId: 'format-test',
          messages: [],
        });
      }

      expect(state.finalResponse).toBe(
        '## Results\n\n- Success: 90%\n- Failed: 10%\n\n**Note:** Review failed items'
      );
    });
  });
});
