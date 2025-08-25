// input for the workflow

import type { PermissionedDataset } from '@buster/access-controls';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import {
  type AnalysisTypeRouterResult,
  type CreateTodosResult,
  type ExtractValuesSearchResult,
  runAnalysisTypeRouterStep,
  runAnalystAgentStep,
  runCreateTodosStep,
  runExtractValuesAndSearchStep,
  runGenerateChatTitleStep,
  runThinkAndPrepAgentStep,
} from '../../steps';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import {
  type AnalystWorkflowOutput,
  type ChartInfo,
  type DataSnapshot,
  extractChartInfo,
  extractToolCallsFromMessages,
  segmentMessagesByUserRequests,
} from './workflow-output.types';

const AnalystWorkflowInputSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
  messageId: z.string().uuid(),
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  dataSourceSyntax: z.string(),
  datasets: z.array(z.custom<PermissionedDataset>()),
});

export type AnalystWorkflowInput = z.infer<typeof AnalystWorkflowInputSchema>;

export async function runAnalystWorkflow(
  input: AnalystWorkflowInput
): Promise<AnalystWorkflowOutput> {
  const workflowStartTime = Date.now();
  const workflowId = `workflow_${input.chatId}_${input.messageId}`;

  const { messages } = input;

  const { todos, values, analysisType } = await runAnalystPrepSteps(input);

  // Add all messages from extract-values step (tool call, result, and optional user message)
  messages.push(...values.messages);

  // Add all messages from create-todos step (tool call, result, and user message)
  messages.push(...todos.messages);

  const thinkAndPrepAgentStepResults = await runThinkAndPrepAgentStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
      userId: input.userId,
      sql_dialect_guidance: input.dataSourceSyntax,
      datasets: input.datasets,
      workflowStartTime,
      analysisMode: analysisType,
    },
    streamOptions: {
      messages,
    },
  });

  messages.push(...thinkAndPrepAgentStepResults.messages);

  const analystAgentStepResults = await runAnalystAgentStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
      userId: input.userId,
      datasets: input.datasets,
      workflowStartTime,
    },
    streamOptions: {
      messages,
    },
  });

  messages.push(...analystAgentStepResults.messages);

  // Extract all tool calls from messages
  const allToolCalls = extractToolCallsFromMessages(messages);

  // Extract charts created from tool calls
  const chartsCreated: ChartInfo[] = [];
  for (const toolCall of allToolCalls) {
    if (
      toolCall.result &&
      (toolCall.toolName === CREATE_METRICS_TOOL_NAME ||
        toolCall.toolName === CREATE_DASHBOARDS_TOOL_NAME ||
        toolCall.toolName === CREATE_REPORTS_TOOL_NAME ||
        toolCall.toolName === MODIFY_METRICS_TOOL_NAME ||
        toolCall.toolName === MODIFY_DASHBOARDS_TOOL_NAME ||
        toolCall.toolName === MODIFY_REPORTS_TOOL_NAME)
    ) {
      const charts = extractChartInfo(toolCall, toolCall.result);
      chartsCreated.push(...charts);
    }
  }

  // Segment messages by user requests
  const userRequestSegments = segmentMessagesByUserRequests(messages, allToolCalls, chartsCreated);

  // Calculate summary statistics
  const failedToolCalls = allToolCalls.filter((tc) => !tc.success);
  const uniqueToolsUsed = [...new Set(allToolCalls.map((tc) => tc.toolName))];
  const chartsByType = chartsCreated.reduce(
    (acc, chart) => {
      acc[chart.type] = (acc[chart.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Extract all data snapshots from SQL execution tool calls
  const allDataSnapshots: DataSnapshot[] = [];
  for (const segment of userRequestSegments) {
    allDataSnapshots.push(...segment.dataSnapshots);
  }

  const totalDataRowsReturned = allDataSnapshots.reduce(
    (sum, snapshot) => sum + snapshot.rowCount,
    0
  );

  const totalSqlQueries = allToolCalls.filter((tc) => tc.toolName === 'executeSql').length;

  const workflowEndTime = Date.now();

  // Construct the comprehensive output
  const output: AnalystWorkflowOutput = {
    workflowId,
    chatId: input.chatId,
    messageId: input.messageId,
    userId: input.userId,
    organizationId: input.organizationId,
    dataSourceId: input.dataSourceId,

    startTime: workflowStartTime,
    endTime: workflowEndTime,
    totalExecutionTimeMs: workflowEndTime - workflowStartTime,

    analysisMode: analysisType === 'investigation' ? 'investigation' : 'standard',

    messages,

    allToolCalls,
    failedToolCalls,

    userRequestSegments,

    chartsCreated,

    summary: {
      totalToolCalls: allToolCalls.length,
      successfulToolCalls: allToolCalls.length - failedToolCalls.length,
      failedToolCalls: failedToolCalls.length,
      totalChartsCreated: chartsCreated.length,
      chartsByType,
      totalDataRowsReturned,
      totalSqlQueries,
      uniqueToolsUsed,
    },
  };

  return output;
}

const AnalystPrepStepSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
  dataSourceId: z.string().uuid(),
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
});

type AnalystPrepStepInput = z.infer<typeof AnalystPrepStepSchema>;

async function runAnalystPrepSteps({
  messages,
  dataSourceId,
  chatId,
  messageId,
}: AnalystPrepStepInput): Promise<{
  todos: CreateTodosResult;
  values: ExtractValuesSearchResult;
  analysisType: AnalysisTypeRouterResult['analysisType'];
}> {
  const [todos, values, , analysisType] = await Promise.all([
    runCreateTodosStep({
      messages,
      messageId,
    }),
    runExtractValuesAndSearchStep({
      messages,
      dataSourceId,
    }),
    runGenerateChatTitleStep({
      messages,
      chatId,
      messageId,
    }),
    runAnalysisTypeRouterStep({
      messages,
    }),
  ]);

  return { todos, values, analysisType: analysisType.analysisType };
}
