import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import { extractFilesFromToolCalls } from './done-tool-file-selection';

describe('done-tool-file-selection', () => {
  describe('extractFilesFromToolCalls', () => {
    test('should extract metrics from create metrics tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Revenue Analysis',
                      version_number: 1,
                    },
                  ],
                  message: 'Metrics created successfully',
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-123',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'metric_file',
        fileName: 'Revenue Analysis',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    test('should extract dashboards from create dashboards tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Sales Dashboard',
                      version_number: 1,
                    },
                  ],
                  message: 'Dashboard created successfully',
                }),
              },
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'tool-456',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'dashboard_file',
        fileName: 'Sales Dashboard',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    test('should extract reports from create reports tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Q4 Analysis Report',
                      version_number: 1,
                    },
                  ],
                  message: 'Report created successfully',
                }),
              },
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'tool-789',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Reports are filtered out from final selection (line 217 in implementation)
      expect(extractedFiles).toHaveLength(0);
    });

    test('should handle modify metrics tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Updated Metric',
                      version_number: 2,
                    },
                  ],
                  message: 'Metric modified successfully',
                }),
              },
              toolName: MODIFY_METRICS_TOOL_NAME,
              toolCallId: 'tool-abc',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'metric_file',
        fileName: 'Updated Metric',
        status: 'completed',
        operation: 'modified',
        versionNumber: 2,
      });
    });

    test('should handle modify dashboards tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Updated Dashboard',
                      version_number: 2,
                    },
                  ],
                  message: 'Dashboard modified successfully',
                }),
              },
              toolName: MODIFY_DASHBOARDS_TOOL_NAME,
              toolCallId: 'tool-def',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'dashboard_file',
        fileName: 'Updated Dashboard',
        status: 'completed',
        operation: 'modified',
        versionNumber: 2,
      });
    });

    test('should handle modify reports tool result with different structure', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  success: true,
                  message: 'Report modified successfully',
                  file: {
                    id: fileId,
                    name: 'Updated Report',
                    content: 'Report content',
                    version_number: 2,
                    updated_at: new Date().toISOString(),
                  },
                }),
              },
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'tool-ghi',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Reports are filtered out from final selection (line 217 in implementation)
      expect(extractedFiles).toHaveLength(0);
    });

    test('should deduplicate files by version number', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Test Metric',
                      version_number: 1,
                    },
                  ],
                  message: 'Created',
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-1',
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Test Metric Updated',
                      version_number: 2,
                    },
                  ],
                  message: 'Modified',
                }),
              },
              toolName: MODIFY_METRICS_TOOL_NAME,
              toolCallId: 'tool-2',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]?.versionNumber).toBe(2);
      expect(extractedFiles[0]?.fileName).toBe('Test Metric Updated');
      expect(extractedFiles[0]?.operation).toBe('modified');
    });

    test('should handle multiple files in a single tool result', () => {
      const fileId1 = randomUUID();
      const fileId2 = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId1,
                      name: 'Metric 1',
                      version_number: 1,
                    },
                    {
                      id: fileId2,
                      name: 'Metric 2',
                      version_number: 1,
                    },
                  ],
                  message: 'Metrics created successfully',
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-multi',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(2);
      expect(extractedFiles[0]?.fileName).toBe('Metric 1');
      expect(extractedFiles[1]?.fileName).toBe('Metric 2');
    });

    test('should handle empty messages array', () => {
      const extractedFiles = extractFilesFromToolCalls([]);
      expect(extractedFiles).toEqual([]);
    });

    test('should ignore messages without tool results', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'user',
          content: 'Create a metric',
        },
        {
          role: 'assistant',
          content: 'I will create a metric for you',
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);
      expect(extractedFiles).toEqual([]);
    });

    test('should handle invalid JSON in tool result', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: 'invalid json',
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-invalid',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);
      expect(extractedFiles).toEqual([]);
    });

    test('should ignore unknown tool names', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: randomUUID(),
                      name: 'Some File',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: 'unknownTool',
              toolCallId: 'tool-unknown',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);
      expect(extractedFiles).toEqual([]);
    });

    test('should filter out reports from final selection', () => {
      const reportId = randomUUID();
      const metricId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: reportId,
                      name: 'Strategic Report',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'tool-report',
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Standalone Metric',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-metric',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Reports should be filtered out
      expect(extractedFiles.find((f) => f.fileType === 'report_file')).toBeUndefined();
      // Standalone metrics should remain
      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: metricId,
        fileType: 'metric_file',
        fileName: 'Standalone Metric',
      });
    });

    test('should exclude metrics referenced in report modifications from response messages', () => {
      // This is the exact scenario from the user's example
      const mockMessages: ModelMessage[] = [
        // Assistant creates 6 metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
              input: {
                files: [
                  { name: 'Customer Segment Lifetime Value Comparison' },
                  { name: 'Customer Retention Rate by Segment' },
                  { name: 'Discount Timing in Customer Journey' },
                  { name: 'Product Category Revenue Mix by Customer Segment' },
                  { name: 'Discount Customer Acquisition Rate Over Time' },
                  { name: 'Customer Lifetime Value by Acquisition Cohort' },
                ],
              },
            },
          ],
        },
        // Tool result with created metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: '4e8bfed0-6a68-4ce8-96d9-b4c282403572',
                      name: 'Customer Segment Lifetime Value Comparison',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: '1c2d12b7-67ee-45e3-9ac8-d30a0d613a9a',
                      name: 'Customer Retention Rate by Segment',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'b1f73cd8-4aa5-40a5-9715-e2cab0bddee0',
                      name: 'Discount Timing in Customer Journey',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: '6b672f26-ee3d-4c7e-90a8-ec444cb671fa',
                      name: 'Product Category Revenue Mix by Customer Segment',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'dd167614-e89a-4b9c-b5ad-1f834adc18d3',
                      name: 'Discount Customer Acquisition Rate Over Time',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: '1f800f5a-8d70-48eb-a408-4550ecbb4fb3',
                      name: 'Customer Lifetime Value by Acquisition Cohort',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
            },
          ],
        },
        // Assistant creates report
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'create-report-1',
              input: {
                name: 'How Discount Strategies Affect Long-Term Customer Behavior',
                content:
                  "Adventure Works' discount strategies demonstrate a sophisticated approach...",
              },
            },
          ],
        },
        // Tool result with created report
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  file: {
                    id: 'ba95b427-07a1-45d5-bc7d-113e0a5c7a5b',
                    name: 'How Discount Strategies Affect Long-Term Customer Behavior',
                    version_number: 1,
                  },
                }),
              },
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'create-report-1',
            },
          ],
        },
        // Assistant modifies report multiple times to add metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'modify-report-1',
              input: {
                id: 'ba95b427-07a1-45d5-bc7d-113e0a5c7a5b',
                name: 'How Discount Strategies Affect Long-Term Customer Behavior',
                edits: [
                  {
                    code: '\n\n## Discount Customers Generate 16x Higher Lifetime Value\n\n<metric metricId="4e8bfed0-6a68-4ce8-96d9-b4c282403572" />\n\nDiscount customers average **$32,192** in lifetime value...',
                    operation: 'append',
                    code_to_replace: '',
                  },
                ],
              },
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'modify-report-2',
              input: {
                id: 'ba95b427-07a1-45d5-bc7d-113e0a5c7a5b',
                name: 'How Discount Strategies Affect Long-Term Customer Behavior',
                edits: [
                  {
                    code: '\n\n## Discounts Dramatically Improve Customer Retention\n\n<metric metricId="1c2d12b7-67ee-45e3-9ac8-d30a0d613a9a" />\n\nDiscount customers achieve a **62.4%** repeat purchase rate...',
                    operation: 'append',
                    code_to_replace: '',
                  },
                ],
              },
            },
          ],
        },
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'modify-report-3',
              input: {
                id: 'ba95b427-07a1-45d5-bc7d-113e0a5c7a5b',
                name: 'How Discount Strategies Affect Long-Term Customer Behavior',
                edits: [
                  {
                    code: '\n\n## More analysis with multiple metrics\n\n<metric metricId="b1f73cd8-4aa5-40a5-9715-e2cab0bddee0" />\n\n<metric metricId="6b672f26-ee3d-4c7e-90a8-ec444cb671fa" />\n\n<metric metricId="dd167614-e89a-4b9c-b5ad-1f834adc18d3" />\n\n<metric metricId="1f800f5a-8d70-48eb-a408-4550ecbb4fb3" />',
                    operation: 'append',
                    code_to_replace: '',
                  },
                ],
              },
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Should NOT include any metrics since they're all referenced in the report
      expect(extractedFiles).toHaveLength(0);

      // Verify no metrics are included
      const metricFiles = extractedFiles.filter((f) => f.fileType === 'metric_file');
      expect(metricFiles).toHaveLength(0);

      // Verify no reports are included (they're handled separately)
      const reportFiles = extractedFiles.filter((f) => f.fileType === 'report_file');
      expect(reportFiles).toHaveLength(0);
    });

    test('should include metrics not referenced in any reports', () => {
      const mockMessages: ModelMessage[] = [
        // Assistant creates metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
              input: {
                files: [
                  { name: 'Metric One' },
                  { name: 'Metric Two' },
                  { name: 'Metric Three' }, // This one won't be referenced
                ],
              },
            },
          ],
        },
        // Tool result with created metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'metric-1',
                      name: 'Metric One',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'metric-2',
                      name: 'Metric Two',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'metric-3',
                      name: 'Metric Three',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
            },
          ],
        },
        // Assistant creates report referencing only 2 metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'create-report-1',
              input: {
                name: 'Test Report',
                content:
                  'Report with metrics\n\n<metric metricId="metric-1" />\n\n<metric metricId="metric-2" />',
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  file: {
                    id: 'report-1',
                    name: 'Test Report',
                    version_number: 1,
                  },
                }),
              },
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'create-report-1',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Should include only metric-3 since it's not referenced
      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]?.id).toBe('metric-3');
      expect(extractedFiles[0]?.fileName).toBe('Metric Three');
    });

    test('should handle complex dashboard with metrics in rows', () => {
      const mockMessages: ModelMessage[] = [
        // Create metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
              input: {
                files: [
                  { name: 'Dashboard Metric 1' },
                  { name: 'Dashboard Metric 2' },
                  { name: 'Dashboard Metric 3' },
                  { name: 'Standalone Metric' },
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
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'dash-metric-1',
                      name: 'Dashboard Metric 1',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'dash-metric-2',
                      name: 'Dashboard Metric 2',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'dash-metric-3',
                      name: 'Dashboard Metric 3',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'standalone-metric',
                      name: 'Standalone Metric',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
            },
          ],
        },
        // Create dashboard with metrics in rows
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'create-dashboard-1',
              input: {
                files: [
                  {
                    name: 'Performance Dashboard',
                    rows: ['dash-metric-1', 'dash-metric-2', 'dash-metric-3'],
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
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'dashboard-1',
                      name: 'Performance Dashboard',
                      file_type: 'dashboard_file',
                      version_number: 1,
                      metric_ids: ['dash-metric-1', 'dash-metric-2', 'dash-metric-3'],
                    },
                  ],
                }),
              },
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'create-dashboard-1',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Dashboard should be included
      expect(extractedFiles.find((f) => f.id === 'dashboard-1')).toBeDefined();

      // Metrics in dashboard should be excluded
      expect(extractedFiles.find((f) => f.id === 'dash-metric-1')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'dash-metric-2')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'dash-metric-3')).toBeUndefined();

      // Standalone metric should be included
      expect(extractedFiles.find((f) => f.id === 'standalone-metric')).toBeDefined();
    });

    test('should handle modify dashboard with added metrics', () => {
      const mockMessages: ModelMessage[] = [
        // Create metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
              input: {
                files: [
                  { name: 'Original Metric' },
                  { name: 'New Metric to Add' },
                  { name: 'Another New Metric' },
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
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'original-metric',
                      name: 'Original Metric',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'new-metric-1',
                      name: 'New Metric to Add',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'new-metric-2',
                      name: 'Another New Metric',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
            },
          ],
        },
        // Create dashboard with original metric
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'create-dashboard-1',
              input: {
                files: [
                  {
                    name: 'My Dashboard',
                    rows: ['original-metric'],
                  },
                ],
              },
            },
          ],
        },
        // Modify dashboard to add more metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: MODIFY_DASHBOARDS_TOOL_NAME,
              toolCallId: 'modify-dashboard-1',
              input: {
                id: 'dashboard-1',
                name: 'My Dashboard',
                edits: [
                  {
                    operation: 'append',
                    rows: ['new-metric-1', 'new-metric-2'],
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
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'dashboard-1',
                      name: 'My Dashboard',
                      file_type: 'dashboard_file',
                      version_number: 2,
                      metric_ids: ['original-metric', 'new-metric-1', 'new-metric-2'],
                    },
                  ],
                }),
              },
              toolName: MODIFY_DASHBOARDS_TOOL_NAME,
              toolCallId: 'modify-dashboard-1',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // All metrics should be excluded since they're in the dashboard
      expect(extractedFiles.find((f) => f.id === 'original-metric')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'new-metric-1')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'new-metric-2')).toBeUndefined();

      // Dashboard should be included
      expect(extractedFiles.find((f) => f.id === 'dashboard-1')).toBeDefined();
    });

    test('should handle mixed reports and dashboards with overlapping metrics', () => {
      const mockMessages: ModelMessage[] = [
        // Create many metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
              input: {
                files: [
                  { name: 'Shared Metric 1' },
                  { name: 'Shared Metric 2' },
                  { name: 'Report Only Metric' },
                  { name: 'Dashboard Only Metric' },
                  { name: 'Standalone Metric' },
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
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'shared-metric-1',
                      name: 'Shared Metric 1',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'shared-metric-2',
                      name: 'Shared Metric 2',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'report-only-metric',
                      name: 'Report Only Metric',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'dashboard-only-metric',
                      name: 'Dashboard Only Metric',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'standalone-metric',
                      name: 'Standalone Metric',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'create-metrics-1',
            },
          ],
        },
        // Create report with some metrics
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'create-report-1',
              input: {
                name: 'Analysis Report',
                content:
                  'Report content\n<metric metricId="shared-metric-1" />\n<metric metricId="shared-metric-2" />\n<metric metricId="report-only-metric" />',
              },
            },
          ],
        },
        // Create dashboard with some metrics (including shared ones)
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'create-dashboard-1',
              input: {
                files: [
                  {
                    name: 'Overview Dashboard',
                    rows: ['shared-metric-1', 'shared-metric-2', 'dashboard-only-metric'],
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
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'dashboard-1',
                      name: 'Overview Dashboard',
                      file_type: 'dashboard_file',
                      version_number: 1,
                      metric_ids: ['shared-metric-1', 'shared-metric-2', 'dashboard-only-metric'],
                    },
                  ],
                }),
              },
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'create-dashboard-1',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // All metrics referenced in report or dashboard should be excluded
      expect(extractedFiles.find((f) => f.id === 'shared-metric-1')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'shared-metric-2')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'report-only-metric')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'dashboard-only-metric')).toBeUndefined();

      // Only standalone metric should be included
      const standaloneMetric = extractedFiles.find((f) => f.id === 'standalone-metric');
      expect(standaloneMetric).toBeDefined();
      expect(standaloneMetric?.fileName).toBe('Standalone Metric');

      // Dashboard should be included
      expect(extractedFiles.find((f) => f.id === 'dashboard-1')).toBeDefined();
    });

    test('should handle multiple metric references in single report edit', () => {
      const mockMessages: ModelMessage[] = [
        // Create metrics
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: 'metric-a',
                      name: 'Metric A',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'metric-b',
                      name: 'Metric B',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'metric-c',
                      name: 'Metric C',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                    {
                      id: 'metric-d',
                      name: 'Metric D',
                      file_type: 'metric_file',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'metrics-1',
            },
          ],
        },
        // Modify report with multiple metrics in different formats
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call',
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'modify-1',
              input: {
                id: 'report-1',
                name: 'Complex Report',
                edits: [
                  {
                    code: `
## Section 1
<metric metricId="metric-a" />

Some text here

## Section 2
Here's another metric: <metric metricId='metric-b' />
And another with spacing: <metric  metricId = "metric-c"  />

## Section 3
<metric
  metricId="metric-d"
/>`,
                    operation: 'append',
                  },
                ],
              },
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // All metrics referenced in report should be excluded
      expect(extractedFiles.find((f) => f.id === 'metric-a')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'metric-b')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'metric-c')).toBeUndefined();
      expect(extractedFiles.find((f) => f.id === 'metric-d')).toBeUndefined();
    });
  });
});
