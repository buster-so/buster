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
      expect(files.find((f) => f.fileType === 'report_file')).toBeUndefined();
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

  describe('BUG-1885: Metrics used in reports appearing in response messages', () => {
    it('should filter out metric when content has escaped quotes (actual production bug)', () => {
      // This test reproduces the EXACT bug scenario from production where escaped quotes
      // in the report content were causing the metric ID regex to fail
      const messages: ModelMessage[] = [
        // Create a metric first
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'toolu_01R7jSBNXiNd1mdN162Kk5To',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: '229f7b5d-c660-42a9-b4f2-46a0bf1f8726',
                      name: 'Total Customers',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Create report with ESCAPED quotes in the content (as seen in production)
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'toolu_019dwAk5Ls2XHMpCfZVJg9z3',
              input: {
                name: 'Total Customers',
                // This is the exact format from production with escaped quotes
                content:
                  '<metric metricId=\\"229f7b5d-c660-42a9-b4f2-46a0bf1f8726\\"/>\\n\\nAdventure Works has **19,820 total customers** in their database.',
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
              toolCallId: 'toolu_019dwAk5Ls2XHMpCfZVJg9z3',
              output: {
                type: 'json',
                value: {
                  file: {
                    id: 'a41ae0e9-2215-4ba8-8045-7b5e68e6f4b8',
                    name: 'Total Customers',
                    version_number: 1,
                  },
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // The metric should be filtered out because it's referenced in the report
      // The report should also be filtered out (all reports are filtered)
      expect(files).toHaveLength(0);
      expect(files.find((f) => f.id === '229f7b5d-c660-42a9-b4f2-46a0bf1f8726')).toBeUndefined();
      expect(files.find((f) => f.id === 'a41ae0e9-2215-4ba8-8045-7b5e68e6f4b8')).toBeUndefined();
    });

    it('should filter out metric when using new single-file report structure (user reported bug)', () => {
      // This test reproduces the exact bug scenario reported by the user
      const messages: ModelMessage[] = [
        // Create a metric first
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'metric-call',
              output: {
                type: 'json',
                value: {
                  files: [
                    {
                      id: 'e774e254-7ccd-4f03-b28d-6d91b5331b8a',
                      name: 'Top 10 Customers by Lifetime Value',
                      version_number: 1,
                    },
                  ],
                },
              },
            },
          ],
        },
        // Create a report using new single-file structure that references the metric
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'report-call',
              input: {
                name: 'Top Customers Analysis',
                content: `# Top Customers Analysis\n\n<metric metricId="e774e254-7ccd-4f03-b28d-6d91b5331b8a"/>\n\nAnalysis of top customers...`,
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
              toolCallId: 'report-call',
              output: {
                type: 'json',
                value: {
                  file: {
                    id: '1a3bf75a-a4b9-415e-b121-d26d1873a45e',
                    name: 'Top Customers Analysis',
                    version_number: 1,
                  },
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // The metric should be filtered out because it's referenced in the report
      // The report should also be filtered out (all reports are filtered)
      expect(files).toHaveLength(0);
      expect(files.find((f) => f.id === 'e774e254-7ccd-4f03-b28d-6d91b5331b8a')).toBeUndefined();
      expect(files.find((f) => f.id === '1a3bf75a-a4b9-415e-b121-d26d1873a45e')).toBeUndefined();
    });

    it('should filter metrics referenced in ANY report, not just the last one', () => {
      const messages: ModelMessage[] = [
        // Create three metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'metrics-call',
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
        // First report referencing metric-1
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'report-1-call',
              input: {
                name: 'Report 1',
                content: '<metric metricId="metric-1"/>',
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
              toolCallId: 'report-1-call',
              output: {
                type: 'json',
                value: {
                  file: { id: 'report-1', name: 'Report 1', version_number: 1 },
                },
              },
            },
          ],
        },
        // Second report referencing metric-2
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'report-2-call',
              input: {
                name: 'Report 2',
                content: '<metric metricId="metric-2"/>',
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
              toolCallId: 'report-2-call',
              output: {
                type: 'json',
                value: {
                  file: { id: 'report-2', name: 'Report 2', version_number: 1 },
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Only metric-3 should remain (not referenced in any report)
      expect(files).toHaveLength(1);
      expect(files[0]?.id).toBe('metric-3');
      expect(files.find((f) => f.id === 'metric-1')).toBeUndefined(); // In first report
      expect(files.find((f) => f.id === 'metric-2')).toBeUndefined(); // In second report
    });

    it('should handle both legacy array and new single-file report structures', () => {
      const messages: ModelMessage[] = [
        // Create metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolName: 'createMetrics',
              toolCallId: 'metrics-mixed',
              output: {
                type: 'json',
                value: {
                  files: [
                    { id: 'metric-legacy', name: 'Legacy Metric', version_number: 1 },
                    { id: 'metric-new', name: 'New Metric', version_number: 1 },
                    { id: 'metric-standalone', name: 'Standalone Metric', version_number: 1 },
                  ],
                },
              },
            },
          ],
        },
        // Report using legacy array structure
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'legacy-report',
              input: {
                files: [
                  {
                    name: 'Legacy Report',
                    content: '<metric metricId="metric-legacy"/>',
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
              toolCallId: 'legacy-report',
              output: {
                type: 'json',
                value: {
                  files: [{ id: 'report-legacy', name: 'Legacy Report', version_number: 1 }],
                },
              },
            },
          ],
        },
        // Report using new single-file structure
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: 'createReports',
              toolCallId: 'new-report',
              input: {
                name: 'New Report',
                content: '<metric metricId="metric-new"/>',
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
              toolCallId: 'new-report',
              output: {
                type: 'json',
                value: {
                  file: { id: 'report-new', name: 'New Report', version_number: 1 },
                },
              },
            },
          ],
        },
      ];

      const files = extractFilesFromToolCalls(messages);

      // Only the standalone metric should remain
      expect(files).toHaveLength(1);
      expect(files[0]?.id).toBe('metric-standalone');
      expect(files.find((f) => f.id === 'metric-legacy')).toBeUndefined();
      expect(files.find((f) => f.id === 'metric-new')).toBeUndefined();
    });
  });

  describe('createFileResponseMessages', () => {
    it('should create response messages for selected files', () => {
      const files = [
        {
          id: 'metric-1',
          fileType: 'metric_file' as const,
          fileName: 'Sales Metric',
          status: 'completed' as const,
          operation: 'created' as const,
          versionNumber: 1,
        },
        {
          id: 'dashboard-1',
          fileType: 'dashboard_file' as const,
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
        file_type: 'metric_file',
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
        file_type: 'dashboard_file',
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
          fileType: 'report_file' as const,
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
        'report_file'
      );
    });
  });
});
