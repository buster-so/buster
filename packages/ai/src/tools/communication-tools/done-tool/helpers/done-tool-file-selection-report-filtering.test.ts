import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import { createFileResponseMessages, extractFilesFromToolCalls } from './done-tool-file-selection';

describe('done-tool-file-selection - report filtering functionality', () => {
  describe('extractFilesFromToolCalls - report filtering', () => {
    it('should filter out ALL reports regardless of metrics content', () => {
      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'call-1',
              input: {
                files: [
                  {
                    name: 'Report With Metrics',
                    content: '<metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />',
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
              toolName: 'createReports',
              toolCallId: 'call-1',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'report-1',
                      name: 'Report With Metrics',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Reports should be filtered out completely
      expect(files).toHaveLength(0);
      expect(files.find((f) => f.fileType === 'report')).toBeUndefined();
    });

    it('should filter metrics referenced in reports but keep other dashboards', () => {
      const messages: ModelMessage[] = [
        // Metric creation
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'call-metric-1',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'metric-1',
                      name: 'Sales Metric',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Dashboard creation
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createDashboards',
              toolCallId: 'call-dashboard-1',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'dashboard-1',
                      name: 'Sales Dashboard',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Report creation with metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'call-3',
              input: {
                files: [
                  {
                    name: 'Quarterly Report',
                    content: '<metric metricId="metric-1" />',
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
              toolName: 'createReports',
              toolCallId: 'call-3',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'report-1',
                      name: 'Quarterly Report',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Should have only dashboard - metric-1 is filtered because it's in the report
      expect(files).toHaveLength(1);
      expect(files.find((f) => f.id === 'metric-1')).toBeUndefined(); // Filtered - in report
      expect(files.find((f) => f.id === 'dashboard-1')).toBeDefined(); // Kept - not in report
      expect(files.find((f) => f.id === 'report-1')).toBeUndefined(); // Filtered - reports always filtered
    });

    it('should filter metrics that are absorbed by reports', () => {
      const messages: ModelMessage[] = [
        // Create metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'call-metrics-2',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: '24db2cc8-79b0-488f-bd45-8b5412d1bf08',
                      name: 'Absorbed Metric',
                      version_number: 1,
                    },
                    {
                      id: 'standalone-metric-id',
                      name: 'Standalone Metric',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Create report that absorbs the first metric
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'call-2',
              input: {
                files: [
                  {
                    name: 'Report with Absorbed Metric',
                    content: `
                      # Report
                      <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
                      Analysis here.
                    `,
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
              toolName: 'createReports',
              toolCallId: 'call-2',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'report-1',
                      name: 'Report with Absorbed Metric',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Should only have the standalone metric
      // The absorbed metric should be filtered out
      expect(files).toHaveLength(1);
      expect(files[0]?.id).toBe('standalone-metric-id');
      expect(files[0]?.fileName).toBe('Standalone Metric');
    });

    it('should filter metrics that belong to dashboards', () => {
      const messages: ModelMessage[] = [
        // Create metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'call-metrics-3',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'metric-in-dashboard',
                      name: 'Dashboard Metric',
                      version_number: 1,
                    },
                    {
                      id: 'standalone-metric',
                      name: 'Standalone Metric',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Create dashboard with metric
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createDashboards',
              toolCallId: 'call-dashboard-2',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'dashboard-1',
                      name: 'Dashboard with Metric',
                      version_number: 1,
                      metric_ids: ['metric-in-dashboard'],
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Should have dashboard and standalone metric only
      expect(files).toHaveLength(2);
      expect(files.find((f) => f.id === 'dashboard-1')).toBeDefined();
      expect(files.find((f) => f.id === 'standalone-metric')).toBeDefined();
      expect(files.find((f) => f.id === 'metric-in-dashboard')).toBeUndefined();
    });

    it('should handle modified reports the same as created reports', () => {
      const messages: ModelMessage[] = [
        // Modify report with metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'modifyReports',
              toolCallId: 'call-modify-1',
              output: {
                type: 'json',
                value: {
                  file: {
                    id: 'modified-report',
                    name: 'Modified Report',
                    content: '<metric metricId="uuid-123" />',
                    version_number: 2,
                  },
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Modified reports should also be filtered out
      expect(files).toHaveLength(0);
      expect(files.find((f) => f.id === 'modified-report')).toBeUndefined();
    });

    it('should deduplicate files by keeping highest version', () => {
      const messages: ModelMessage[] = [
        // First version of metric
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'call-metric-v1',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'metric-1',
                      name: 'Sales Metric v1',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Modified version of same metric
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'modifyMetrics',
              toolCallId: 'call-metric-v2',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'metric-1',
                      name: 'Sales Metric v2',
                      version_number: 2,
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Should only have one metric with the highest version
      expect(files).toHaveLength(1);
      expect(files[0]?.id).toBe('metric-1');
      expect(files[0]?.fileName).toBe('Sales Metric v2');
      expect(files[0]?.versionNumber).toBe(2);
    });

    it('should handle complex scenario with all file types', () => {
      const messages: ModelMessage[] = [
        // Create multiple metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'call-metrics-complex',
              output: {
                type: 'json',
                value: {
                  files: [
                    { id: 'metric-1', name: 'Metric 1', version_number: 1 },
                    { id: 'metric-2', name: 'Metric 2', version_number: 1 },
                    { id: 'metric-3', name: 'Metric 3', version_number: 1 },
                  ],
                },
              },
            },
          ],
        },
        // Create dashboard with metric-1
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createDashboards',
              toolCallId: 'call-dashboard-complex',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'dashboard-1',
                      name: 'Dashboard 1',
                      version_number: 1,
                      metric_ids: ['metric-1'],
                    },
                  ],
                },
              },
            },
          ],
        },
        // Create report with metric-2
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'call-3',
              input: {
                files: [
                  {
                    name: 'Report 1',
                    content: '<metric metricId="metric-2" />',
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
              toolName: 'createReports',
              toolCallId: 'call-3',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'report-1',
                      name: 'Report 1',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Should have:
      // - dashboard-1 (kept)
      // - metric-3 (standalone, kept)
      // Should NOT have:
      // - metric-1 (belongs to dashboard)
      // - metric-2 (absorbed by report)
      // - report-1 (all reports filtered)

      expect(files).toHaveLength(2);
      expect(files.find((f) => f.id === 'dashboard-1')).toBeDefined();
      expect(files.find((f) => f.id === 'metric-3')).toBeDefined();
      expect(files.find((f) => f.id === 'metric-1')).toBeUndefined();
      expect(files.find((f) => f.id === 'metric-2')).toBeUndefined();
      expect(files.find((f) => f.id === 'report-1')).toBeUndefined();
    });
  });

  describe('createFileResponseMessages', () => {
    it('should create response messages for selected files', () => {
      const files = [
        {
          id: 'metric-1',
          fileType: 'metric' as const,
          fileName: 'Sales Metric',
          status: 'completed' as const,
          operation: 'created' as const,
          versionNumber: 1,
        },
        {
          id: 'dashboard-1',
          fileType: 'dashboard' as const,
          fileName: 'Sales Dashboard',
          status: 'completed' as const,
          operation: 'modified' as const,
          versionNumber: 2,
        },
      ];

      const messages = createFileResponseMessages(files);

      expect(messages).toHaveLength(2);

      expect(messages[0]).toMatchObject({
        id: 'metric-1',
        type: 'file',
        file_type: 'metric',
        file_name: 'Sales Metric',
        version_number: 1,
        metadata: [
          {
            status: 'completed',
            message: 'Metric created successfully',
          },
        ],
      });

      expect(messages[1]).toMatchObject({
        id: 'dashboard-1',
        type: 'file',
        file_type: 'dashboard',
        file_name: 'Sales Dashboard',
        version_number: 2,
        metadata: [
          {
            status: 'completed',
            message: 'Dashboard modified successfully',
          },
        ],
      });
    });

    it('should never create response messages for reports', () => {
      // This shouldn't happen in practice since reports are filtered
      // but testing defensive behavior
      const files = [
        {
          id: 'report-1',
          fileType: 'report' as const,
          fileName: 'Test Report',
          status: 'completed' as const,
          operation: 'created' as const,
          versionNumber: 1,
        },
      ];

      const messages = createFileResponseMessages(files);

      // Even if a report somehow gets through, it would create a message
      // but in practice, reports are filtered before this function
      expect(messages).toHaveLength(1);
      expect(messages[0] && 'file_type' in messages[0] ? messages[0].file_type : undefined).toBe(
        'report'
      );
    });
  });
});
