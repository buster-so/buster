import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import { type AnalysisMode, AnalysisModeSchema } from '../../types/analysis-mode.types';

// Tool call tracking
export const ToolCallInfoSchema = z.object({
  toolCallId: z.string(),
  toolName: z.string(),
  timestamp: z.number(),
  success: z.boolean(),
  error: z.string().optional(),
  executionTimeMs: z.number().optional(),
  // Raw arguments passed to the tool
  args: z.unknown().optional(),
  // Raw result from the tool
  result: z.unknown().optional(),
});

export type ToolCallInfo = z.infer<typeof ToolCallInfoSchema>;

// Data snapshot for SQL execution results
export const DataSnapshotSchema = z.object({
  sql: z.string(),
  rowCount: z.number(),
  columnCount: z.number(),
  columns: z.array(z.string()),
  // Sample of first 10 rows
  sampleData: z.array(z.record(z.unknown())).optional(),
  executionTimeMs: z.number().optional(),
  error: z.string().optional(),
});

export type DataSnapshot = z.infer<typeof DataSnapshotSchema>;

// Chart/Visualization tracking
export const ChartInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['metric_file', 'dashboard_file', 'report_file']),
  chartType: z.string().optional(), // from selectedChartType
  chartConfig: z.custom<ChartConfigProps>().optional(),
  sql: z.string().optional(),
  dataSnapshot: DataSnapshotSchema.optional(),
  ymlContent: z.string(),
  createdAt: z.number(),
  toolCallId: z.string(), // Links to the tool call that created it
});

export type ChartInfo = z.infer<typeof ChartInfoSchema>;

// User request segment - groups tool calls between user messages
export const UserRequestSegmentSchema = z.object({
  userMessage: z.custom<ModelMessage>(),
  userMessageIndex: z.number(),
  timestamp: z.number(),
  toolCalls: z.array(ToolCallInfoSchema),
  // Charts created in response to this user request
  chartsCreated: z.array(ChartInfoSchema),
  // Data returned from SQL queries in this segment
  dataSnapshots: z.array(DataSnapshotSchema),
});

export type UserRequestSegment = z.infer<typeof UserRequestSegmentSchema>;

// Complete workflow output
export const AnalystWorkflowOutputSchema = z.object({
  // Original workflow input data
  workflowId: z.string(),
  chatId: z.string(),
  messageId: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  dataSourceId: z.string(),

  // Execution metadata
  startTime: z.number(),
  endTime: z.number(),
  totalExecutionTimeMs: z.number(),

  // Analysis mode selected by router
  analysisMode: AnalysisModeSchema,

  // All messages (including tool calls/results)
  messages: z.array(z.custom<ModelMessage>()),

  // Tool call tracking
  allToolCalls: z.array(ToolCallInfoSchema),
  failedToolCalls: z.array(ToolCallInfoSchema),

  // User request segments (tool calls grouped by user messages)
  userRequestSegments: z.array(UserRequestSegmentSchema),

  // All charts/visualizations created
  chartsCreated: z.array(ChartInfoSchema),

  // Summary statistics
  summary: z.object({
    totalToolCalls: z.number(),
    successfulToolCalls: z.number(),
    failedToolCalls: z.number(),
    totalChartsCreated: z.number(),
    chartsByType: z.record(z.number()), // metric: 5, dashboard: 2, etc.
    totalDataRowsReturned: z.number(),
    totalSqlQueries: z.number(),
    uniqueToolsUsed: z.array(z.string()),
  }),
});

export type AnalystWorkflowOutput = z.infer<typeof AnalystWorkflowOutputSchema>;

// Helper type for tracking state during workflow execution
export interface WorkflowTrackingState {
  toolCalls: ToolCallInfo[];
  chartsCreated: ChartInfo[];
  dataSnapshots: DataSnapshot[];
  currentUserMessageIndex: number;
  userRequestSegments: UserRequestSegment[];
}

// Helper function to initialize tracking state
export function createWorkflowTrackingState(): WorkflowTrackingState {
  return {
    toolCalls: [],
    chartsCreated: [],
    dataSnapshots: [],
    currentUserMessageIndex: -1,
    userRequestSegments: [],
  };
}

// Helper function to extract chart info from tool result
export function extractChartInfo(toolCall: ToolCallInfo, toolResult: unknown): ChartInfo[] {
  const charts: ChartInfo[] = [];

  if (!toolResult || !toolCall.success) {
    return charts;
  }

  const result = toolResult as Record<string, unknown>;
  const args = toolCall.args as Record<string, unknown> | undefined;

  // Handle createMetrics and modifyMetrics tool results
  if (
    (toolCall.toolName === CREATE_METRICS_TOOL_NAME ||
      toolCall.toolName === MODIFY_METRICS_TOOL_NAME) &&
    result.files &&
    Array.isArray(result.files)
  ) {
    // Get the input files array to match YML content with output
    const inputFiles = args?.files as Record<string, unknown>[] | undefined;
    const resultFiles = result.files as unknown[];

    for (let i = 0; i < resultFiles.length; i++) {
      const file = resultFiles[i] as Record<string, unknown>;

      // Find corresponding input file by matching name or index
      let ymlContent = '';
      if (inputFiles?.[i]) {
        ymlContent = String(inputFiles[i]?.yml_content || '');
      }

      // Parse the YAML to extract chart config and SQL
      let chartConfig: ChartConfigProps | undefined;
      let sql: string | undefined;
      let chartType: string | undefined;

      try {
        // Extract chart type from selectedChartType field
        const chartTypeMatch = ymlContent.match(/selectedChartType:\s*['"]?(\w+)['"]?/);
        if (chartTypeMatch?.[1]) {
          chartType = chartTypeMatch[1];
        }

        // Extract SQL query
        const sqlMatch = ymlContent.match(/sql:\s*\|\s*([\s\S]*?)(?=\n\w|\n$)/);
        if (sqlMatch?.[1]) {
          sql = sqlMatch[1].trim();
        }

        // Extract chart config section
        const chartConfigMatch = ymlContent.match(/chartConfig:\s*([\s\S]*?)(?=\n\w|\n$)/);
        if (chartConfigMatch) {
          // For now, we'll create a basic chart config with the chart type
          chartConfig = { selectedChartType: chartType } as ChartConfigProps;
        }
      } catch (_e) {
        // Ignore parsing errors
      }

      charts.push({
        id: String(file.id || ''),
        name: String(file.name || ''),
        type: 'metric_file',
        chartType,
        chartConfig,
        sql,
        ymlContent,
        createdAt: Date.now(),
        toolCallId: toolCall.toolCallId,
      });
    }
  }

  // Handle createDashboards and modifyDashboards tool results
  if (
    (toolCall.toolName === CREATE_DASHBOARDS_TOOL_NAME ||
      toolCall.toolName === MODIFY_DASHBOARDS_TOOL_NAME) &&
    result.files &&
    Array.isArray(result.files)
  ) {
    const inputFiles = args?.files as Record<string, unknown>[] | undefined;
    const resultFiles = result.files as unknown[];

    for (let i = 0; i < resultFiles.length; i++) {
      const file = resultFiles[i] as Record<string, unknown>;

      let ymlContent = '';
      if (inputFiles?.[i]) {
        ymlContent = String(inputFiles[i]?.yml_content || '');
      }

      charts.push({
        id: String(file.id || ''),
        name: String(file.name || ''),
        type: 'dashboard_file',
        ymlContent,
        createdAt: Date.now(),
        toolCallId: toolCall.toolCallId,
      });
    }
  }

  // Handle createReports and modifyReports tool results
  if (
    (toolCall.toolName === CREATE_REPORTS_TOOL_NAME ||
      toolCall.toolName === MODIFY_REPORTS_TOOL_NAME) &&
    result.files &&
    Array.isArray(result.files)
  ) {
    const inputFiles = args?.files as Record<string, unknown>[] | undefined;
    const resultFiles = result.files as unknown[];

    for (let i = 0; i < resultFiles.length; i++) {
      const file = resultFiles[i] as Record<string, unknown>;

      let ymlContent = '';
      if (inputFiles?.[i]) {
        // For reports, the content field is used instead of yml_content
        ymlContent = String(inputFiles[i]?.content || inputFiles[i]?.yml_content || '');
      }

      charts.push({
        id: String(file.id || ''),
        name: String(file.name || ''),
        type: 'report_file',
        ymlContent,
        createdAt: Date.now(),
        toolCallId: toolCall.toolCallId,
      });
    }
  }

  return charts;
}

// Helper function to extract data snapshot from SQL execution
export function extractDataSnapshot(toolCall: ToolCallInfo, toolResult: unknown): DataSnapshot[] {
  const snapshots: DataSnapshot[] = [];

  const sqlResult = toolResult as Record<string, unknown>;
  if (
    toolCall.toolName !== 'executeSql' ||
    !sqlResult?.results ||
    !Array.isArray(sqlResult.results)
  ) {
    return snapshots;
  }

  for (const result of sqlResult.results as Record<string, unknown>[]) {
    if (result.status === 'success' && result.results) {
      const rows = result.results as Record<string, unknown>[];
      const columns = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : [];

      snapshots.push({
        sql: String(result.sql || ''),
        rowCount: rows.length,
        columnCount: columns.length,
        columns,
        sampleData: rows.slice(0, 10), // First 10 rows as sample
        executionTimeMs: toolCall.executionTimeMs,
      });
    } else if (result.status === 'error') {
      snapshots.push({
        sql: String(result.sql || ''),
        rowCount: 0,
        columnCount: 0,
        columns: [],
        error: result.error_message ? String(result.error_message) : undefined,
        executionTimeMs: toolCall.executionTimeMs,
      });
    }
  }

  return snapshots;
}

// Helper to extract tool calls from messages
export function extractToolCallsFromMessages(messages: ModelMessage[]): ToolCallInfo[] {
  const toolCalls: ToolCallInfo[] = [];
  const toolResultsMap = new Map<string, unknown>();

  // First pass: collect tool results
  for (const message of messages) {
    if (message.role === 'tool' && Array.isArray(message.content)) {
      for (const item of message.content) {
        if (typeof item === 'object' && 'type' in item && item.type === 'tool-result') {
          const toolResult = item as {
            toolCallId: string;
            toolName: string;
            result?: unknown;
            output?: {
              type: string;
              value?: unknown;
            };
            error?: unknown;
          };

          // Extract the actual result from output.value if it exists
          let actualResult = toolResult.result;
          if (toolResult.output?.value) {
            // If output.value is a string and type is 'json', try to parse it
            if (toolResult.output.type === 'json' && typeof toolResult.output.value === 'string') {
              try {
                actualResult = JSON.parse(toolResult.output.value);
              } catch {
                actualResult = toolResult.output.value;
              }
            } else {
              actualResult = toolResult.output.value;
            }
          }

          toolResultsMap.set(toolResult.toolCallId, {
            ...toolResult,
            result: actualResult,
          });
        }
      }
    }
  }

  // Second pass: extract tool calls and match with results
  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const item of message.content) {
        if (typeof item === 'object' && 'type' in item && item.type === 'tool-call') {
          const toolCall = item as {
            toolCallId: string;
            toolName: string;
            args?: unknown;
            input?: unknown; // The actual args might be in 'input' field
          };
          const toolResult = toolResultsMap.get(toolCall.toolCallId) as
            | {
                result?: unknown;
                error?: unknown;
              }
            | undefined;

          // Get args from either 'args' or 'input' field
          const args = toolCall.args || toolCall.input;

          const toolCallInfo: ToolCallInfo = {
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            timestamp: Date.now(),
            success: toolResult ? !toolResult.error : false,
            error: toolResult?.error ? String(toolResult.error) : undefined,
            args,
            result: toolResult?.result,
          };

          toolCalls.push(toolCallInfo);
        }
      }
    }
  }

  return toolCalls;
}

// Helper to segment messages by user requests
export function segmentMessagesByUserRequests(
  messages: ModelMessage[],
  allToolCalls: ToolCallInfo[],
  chartsCreated: ChartInfo[]
): UserRequestSegment[] {
  const segments: UserRequestSegment[] = [];
  let currentSegment: UserRequestSegment | null = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];

    if (message && message.role === 'user') {
      // Start a new segment for user messages
      if (currentSegment) {
        segments.push(currentSegment);
      }

      currentSegment = {
        userMessage: message,
        userMessageIndex: i,
        timestamp: Date.now(),
        toolCalls: [],
        chartsCreated: [],
        dataSnapshots: [],
      };
    } else if (
      currentSegment &&
      message &&
      message.role === 'assistant' &&
      Array.isArray(message.content)
    ) {
      // Extract tool calls from this assistant message
      for (const item of message.content) {
        if (typeof item === 'object' && 'type' in item && item.type === 'tool-call') {
          const toolCallItem = item as { toolCallId: string; toolName: string };

          // Find the corresponding tool call info
          const toolCallInfo = allToolCalls.find((tc) => tc.toolCallId === toolCallItem.toolCallId);
          if (toolCallInfo) {
            currentSegment.toolCalls.push(toolCallInfo);

            // Add related charts
            const relatedCharts = chartsCreated.filter(
              (chart) => chart.toolCallId === toolCallInfo.toolCallId
            );
            currentSegment.chartsCreated.push(...relatedCharts);

            // Extract data snapshots from SQL executions
            if (toolCallInfo.toolName === 'executeSql' && toolCallInfo.result) {
              const snapshots = extractDataSnapshot(toolCallInfo, toolCallInfo.result);
              currentSegment.dataSnapshots.push(...snapshots);
            }
          }
        }
      }
    }
  }

  // Add the last segment if it exists
  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}
