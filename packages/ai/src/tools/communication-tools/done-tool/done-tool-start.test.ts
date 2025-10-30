import { randomUUID } from 'node:crypto';
import type { ModelMessage, ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import type { DoneToolContext, DoneToolState } from './done-tool';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolStart } from './done-tool-start';

// Mock database queries
vi.mock('@buster/database/queries', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    updateChat: vi.fn(),
    updateMessage: vi.fn(),
    updateMessageEntries: vi.fn().mockResolvedValue({
      success: true,
      sequenceNumber: 0,
      skipped: false as const,
    }),
    waitForPendingUpdates: vi.fn().mockResolvedValue(undefined),
    isMessageUpdateQueueClosed: vi.fn().mockReturnValue(false),
    getAssetLatestVersion: vi.fn().mockResolvedValue(1),
    closeMessageUpdateQueue: vi.fn(),
  };
});

// Import mocked functions after the mock definition
import {
  getAssetLatestVersion,
  isMessageUpdateQueueClosed,
  updateChat,
  updateMessage,
  updateMessageEntries,
  waitForPendingUpdates,
} from '@buster/database/queries';

// Type assertion for mocked functions
const mockedIsMessageUpdateQueueClosed = vi.mocked(isMessageUpdateQueueClosed);
const mockedWaitForPendingUpdates = vi.mocked(waitForPendingUpdates);
const mockedGetAssetLatestVersion = vi.mocked(getAssetLatestVersion);

describe('done-tool-start', () => {
  const mockContext: DoneToolContext = {
    chatId: 'chat-123',
    messageId: 'message-456',
    workflowStartTime: Date.now() - 5000,
  };

  const mockDoneToolState: DoneToolState = {
    toolCallId: undefined,
    args: undefined,
    finalResponse: undefined,
  };

  // Helper to create mock ToolCallOptions
  const createMockToolCallOptions = (
    overrides: Partial<ToolCallOptions> = {}
  ): ToolCallOptions => ({
    messages: [],
    toolCallId: 'done-call',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsMessageUpdateQueueClosed.mockReturnValue(false);
    mockedWaitForPendingUpdates.mockResolvedValue(undefined);
    mockedGetAssetLatestVersion.mockResolvedValue(1);
  });

  describe('mostRecentFile selection', () => {
    it('should prioritize report files when present', async () => {
      const reportId = randomUUID();
      const metricId = randomUUID();
      const dashboardId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'report-call',
              input: {
                files: [{ yml_content: 'report content with metrics' }],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'report-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: reportId,
                      name: 'Analysis Report',
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
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metric-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Revenue Metric',
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
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'dashboard-call',
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
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      // Start phase - initializes state
      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - streams in the assets and final response
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

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: reportId,
        mostRecentFileType: 'report_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should use first extracted file when no reports exist', async () => {
      const metricId1 = randomUUID();
      const metricId2 = randomUUID();
      const dashboardId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metric-call-1',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId1,
                      name: 'First Metric',
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
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metric-call-2',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId2,
                      name: 'Second Metric',
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
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'dashboard-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: dashboardId,
                      name: 'Dashboard',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the first metric as the asset to return
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: metricId1,
            assetName: 'Revenue Growth',
            assetType: 'metric_file',
          },
        ],
        finalResponse: 'Metrics created successfully',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Should select the first metric (first in extractedFiles)
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: metricId1,
        mostRecentFileType: 'metric_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should handle report with absorbed metrics correctly', async () => {
      const reportId = randomUUID();
      const absorbedMetricId = randomUUID();
      const standaloneMetricId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metrics-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: absorbedMetricId,
                      name: 'Absorbed Metric',
                      version_number: 1,
                    },
                    {
                      id: standaloneMetricId,
                      name: 'Standalone Metric',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
        // Add assistant message that references the metric in report modification
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'report-call',
              input: {
                id: reportId,
                name: 'Report with Metrics',
                edits: [
                  {
                    code: `<metric metricId="${absorbedMetricId}" />`,
                    operation: 'append',
                    code_to_replace: '',
                  },
                ],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'report-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  file: {
                    id: reportId,
                    name: 'Report with Metrics',
                    version_number: 1,
                    content: `<metric metricId="${absorbedMetricId}" />`,
                  },
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the report and standalone metric as assets to return
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: reportId,
            assetName: 'Monthly Report',
            assetType: 'report_file',
          },
          {
            assetId: standaloneMetricId,
            assetName: 'Standalone Metric',
            assetType: 'metric_file',
          },
        ],
        finalResponse: 'Report created with embedded metrics',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Report should be selected as mostRecentFile
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: reportId,
        mostRecentFileType: 'report_file',
        mostRecentVersionNumber: 1,
      });

      // Verify that only the standalone metric was added as a response message
      expect(updateMessageEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'message-456',
          responseMessages: expect.arrayContaining([
            expect.objectContaining({
              id: standaloneMetricId,
              file_name: 'Standalone Metric',
              file_type: 'metric_file',
            }),
          ]),
        })
      );

      // Absorbed metric should NOT be in response messages
      const calls = (updateMessageEntries as any).mock.calls;
      const responseMessageCalls = calls.filter((call: any) => call[0].responseMessages);
      for (const call of responseMessageCalls) {
        const responseMessages = call[0].responseMessages || [];
        expect(responseMessages.find((msg: any) => msg.id === absorbedMetricId)).toBeUndefined();
      }
    });

    it('should use first metric when multiple metrics are created', async () => {
      const metricId1 = randomUUID();
      const metricId2 = randomUUID();
      const metricId3 = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metrics-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId1,
                      name: 'Metric 1',
                      version_number: 1,
                    },
                    {
                      id: metricId2,
                      name: 'Metric 2',
                      version_number: 1,
                    },
                    {
                      id: metricId3,
                      name: 'Metric 3',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the first metric
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: metricId1,
            assetName: 'Revenue Metric',
            assetType: 'metric_file',
          },
        ],
        finalResponse: 'Multiple metrics created',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Should select the first metric
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: metricId1,
        mostRecentFileType: 'metric_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should use first dashboard when multiple dashboards are created', async () => {
      const dashboardId1 = randomUUID();
      const dashboardId2 = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'dashboards-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: dashboardId1,
                      name: 'Dashboard 1',
                      version_number: 1,
                    },
                    {
                      id: dashboardId2,
                      name: 'Dashboard 2',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the first dashboard
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: dashboardId1,
            assetName: 'Main Dashboard',
            assetType: 'dashboard_file',
          },
        ],
        finalResponse: 'Multiple dashboards created',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Should select the first dashboard
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: dashboardId1,
        mostRecentFileType: 'dashboard_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should handle mixed metrics and dashboards correctly', async () => {
      const metricId = randomUUID();
      const dashboardId = randomUUID();

      const mockMessages: ModelMessage[] = [
        // Dashboard created first in message order
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'dashboard-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: dashboardId,
                      name: 'Dashboard',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
        // Metric created second
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metric-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Metric',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the dashboard
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: dashboardId,
            assetName: 'Analytics Dashboard',
            assetType: 'dashboard_file',
          },
        ],
        finalResponse: 'Dashboard and metrics created',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Should select the dashboard (first in extractedFiles)
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: dashboardId,
        mostRecentFileType: 'dashboard_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should handle empty file lists gracefully', async () => {
      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: [],
        })
      );

      // Should not call updateChat when no files exist
      expect(updateChat).not.toHaveBeenCalled();
    });

    it('should handle only report files that are filtered out', async () => {
      const reportId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'report-call',
              input: {
                files: [{ yml_content: 'simple report without metrics' }],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'report-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: reportId,
                      name: 'Simple Report',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the report
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: reportId,
            assetName: 'Analysis Report',
            assetType: 'report_file',
          },
        ],
        finalResponse: 'Report created',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Report should still be selected as mostRecentFile
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: reportId,
        mostRecentFileType: 'report_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should handle dashboards with embedded metrics correctly', async () => {
      const dashboardId = randomUUID();
      const embeddedMetricId = randomUUID();
      const standaloneMetricId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metrics-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: embeddedMetricId,
                      name: 'Embedded Metric',
                      version_number: 1,
                    },
                    {
                      id: standaloneMetricId,
                      name: 'Standalone Metric',
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
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'dashboard-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: dashboardId,
                      name: 'Dashboard with Metrics',
                      version_number: 1,
                      metric_ids: [embeddedMetricId],
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(mockContext, mockDoneToolState);
      const doneToolDelta = createDoneToolDelta(mockContext, mockDoneToolState);

      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Delta phase - stream in the dashboard (metrics are embedded)
      const deltaInput = JSON.stringify({
        assetsToReturn: [
          {
            assetId: dashboardId,
            assetName: 'Main Dashboard',
            assetType: 'dashboard_file',
          },
        ],
        finalResponse: 'Dashboard with metrics created',
      });

      await doneToolDelta({
        inputTextDelta: deltaInput,
        ...createMockToolCallOptions({ toolCallId: 'done-call' }),
      });

      // Should select the dashboard since that's what we're returning
      expect(updateChat).toHaveBeenCalledWith('chat-123', {
        mostRecentFileId: dashboardId,
        mostRecentFileType: 'dashboard_file',
        mostRecentVersionNumber: 1,
      });
    });

    it('should handle context with empty chatId', async () => {
      const contextWithEmptyChatId: DoneToolContext = {
        messageId: mockContext.messageId,
        chatId: '', // Empty string to simulate missing/invalid chatId
        workflowStartTime: mockContext.workflowStartTime,
      };

      const metricId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metric-call',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Test Metric',
                      version_number: 1,
                    },
                  ],
                }),
              },
            },
          ],
        },
      ];

      const doneToolStart = createDoneToolStart(contextWithEmptyChatId, mockDoneToolState);
      await doneToolStart(
        createMockToolCallOptions({
          toolCallId: 'done-call',
          messages: mockMessages,
        })
      );

      // Should not call updateChat when chatId is missing
      expect(updateChat).not.toHaveBeenCalled();
      // But should still update message entries
      expect(updateMessageEntries).toHaveBeenCalled();
    });
  });
});
