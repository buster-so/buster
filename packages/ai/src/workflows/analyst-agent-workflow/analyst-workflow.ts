// input for the workflow

import type { PermissionedDataset } from '@buster/access-controls';
import {
  MessageAnalysisModeSchema,
  UserPersonalizationConfigSchema,
  type UserPersonalizationConfigType,
} from '@buster/database/schema-types';
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
import { extractUserAndDoneToolMessages } from '../../utils';
import type { StepRetryOptions } from '../../utils/with-step-retry';
import { withStepRetry } from '../../utils/with-step-retry';
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
  messageAnalysisMode: MessageAnalysisModeSchema.optional(),
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  dataSourceSyntax: z.string(),
  datasets: z.array(z.custom<PermissionedDataset>()),
  analystInstructions: z.string().optional(),
  organizationDocs: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        content: z.string(),
        type: z.string(),
        updatedAt: z.string(),
      })
    )
    .optional(),
  userPersonalizationConfig: UserPersonalizationConfigSchema.optional(),
});

export type AnalystWorkflowInput = z.infer<typeof AnalystWorkflowInputSchema>;

export async function runAnalystWorkflow(
  input: AnalystWorkflowInput
): Promise<AnalystWorkflowOutput> {
  const workflowStartTime = Date.now();
  const workflowId = `workflow_${input.chatId}_${input.messageId}`;

  const { messages, analystInstructions, organizationDocs, userPersonalizationConfig } = input;

  const userPersonalizationMessageContent =
    generatePersonalizationMessageContent(userPersonalizationConfig);

  const { todos, values, analysisMode } = await runAnalystPrepSteps(input);

  // Add all messages from extract-values step (tool call, result, and optional user message)
  messages.push(...values.messages);

  // Add all messages from create-todos step (tool call, result, and user message)
  messages.push(...todos.messages);

  // const thinkAndPrepAgentStepResults = await runThinkAndPrepAgentStep({
  //   options: {
  //     messageId: input.messageId,
  //     chatId: input.chatId,
  //     organizationId: input.organizationId,
  //     dataSourceId: input.dataSourceId,
  //     dataSourceSyntax: input.dataSourceSyntax,
  //     userId: input.userId,
  //     sql_dialect_guidance: input.dataSourceSyntax,
  //     datasets: input.datasets,
  //     workflowStartTime,
  //     analysisMode,
  //     analystInstructions,
  //     organizationDocs,
  //     userPersonalizationMessageContent,
  //   },
  //   streamOptions: {
  //     messages,
  //   },
  // });

  // console.info('[runAnalystWorkflow] DEBUG: Think-and-prep results', {
  //   workflowId,
  //   messageId: input.messageId,
  //   earlyTermination: thinkAndPrepAgentStepResults.earlyTermination,
  //   messageCount: thinkAndPrepAgentStepResults.messages.length,
  // });

  // messages.push(...thinkAndPrepAgentStepResults.messages);

  // // Check if think-and-prep agent terminated early (clarifying question or direct response)
  let analystAgentStepResults = { messages: [] as ModelMessage[] };

  // if (!thinkAndPrepAgentStepResults.earlyTermination) {
  //   console.info('[runAnalystWorkflow] Running analyst agent step (early termination = false)', {
  //     workflowId,
  //     messageId: input.messageId,
  //     earlyTermination: thinkAndPrepAgentStepResults.earlyTermination,
  //   });

  analystAgentStepResults = await runAnalystAgentStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
      userId: input.userId,
      datasets: input.datasets,
      workflowStartTime,
      analysisMode,
      analystInstructions,
      organizationDocs,
      userPersonalizationMessageContent,
    },
    streamOptions: {
      messages,
    },
  });

  messages.push(...analystAgentStepResults.messages);
  // } else {
  //   console.info('[runAnalystWorkflow] DEBUG: SKIPPING analyst agent due to early termination', {
  //     workflowId,
  //     messageId: input.messageId,
  //     earlyTermination: thinkAndPrepAgentStepResults.earlyTermination,
  //   });
  // }

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

    analysisMode: analysisMode === 'investigation' ? 'investigation' : 'standard',

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
  messageAnalysisMode: MessageAnalysisModeSchema.optional(),
  userPersonalizationConfig: UserPersonalizationConfigSchema.optional(),
});

type AnalystPrepStepInput = z.infer<typeof AnalystPrepStepSchema>;

// Default retry configuration for pre-agent preparation steps
const DEFAULT_PREP_STEP_RETRY_CONFIG: Omit<StepRetryOptions, 'stepName'> = {
  maxAttempts: 3,
  baseDelayMs: 2000,
};

async function runAnalystPrepSteps({
  messages,
  dataSourceId,
  chatId,
  messageId,
  messageAnalysisMode,
  userPersonalizationConfig,
}: AnalystPrepStepInput): Promise<{
  todos: CreateTodosResult;
  values: ExtractValuesSearchResult;
  analysisMode: AnalysisTypeRouterResult['analysisMode'];
}> {
  const filteredToUserAndDoneToolMessages = extractUserAndDoneToolMessages(messages);
  const shouldInjectUserPersonalizationTodo = Boolean(userPersonalizationConfig);
  const [todos, values, , analysisMode] = await Promise.all([
    withStepRetry(
      () =>
        runCreateTodosStep({
          messages,
          messageId,
          shouldInjectUserPersonalizationTodo,
        }),
      {
        ...DEFAULT_PREP_STEP_RETRY_CONFIG,
        stepName: 'create-todos',
        onRetry: (attempt, error) => {
          console.info('[create-todos] Retrying after error', {
            messageId,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    ),
    withStepRetry(
      () =>
        runExtractValuesAndSearchStep({
          messages: filteredToUserAndDoneToolMessages,
          dataSourceId,
        }),
      {
        ...DEFAULT_PREP_STEP_RETRY_CONFIG,
        stepName: 'extract-values',
        onRetry: (attempt, error) => {
          console.info('[extract-values] Retrying after error', {
            messageId,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    ),
    withStepRetry(
      () =>
        runGenerateChatTitleStep({
          messages: filteredToUserAndDoneToolMessages,
          chatId,
          messageId,
        }),
      {
        ...DEFAULT_PREP_STEP_RETRY_CONFIG,
        stepName: 'generate-chat-title',
        onRetry: (attempt, error) => {
          console.info('[generate-chat-title] Retrying after error', {
            messageId,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    ),
    withStepRetry(
      () =>
        runAnalysisTypeRouterStep({
          messages: filteredToUserAndDoneToolMessages,
          messageAnalysisMode,
        }),
      {
        ...DEFAULT_PREP_STEP_RETRY_CONFIG,
        stepName: 'analysis-type-router',
        onRetry: (attempt, error) => {
          console.info('[analysis-type-router] Retrying after error', {
            messageId,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        },
      }
    ),
  ]);

  return { todos, values, analysisMode: analysisMode.analysisMode };
}

function generatePersonalizationMessageContent(
  userPersonalizationConfig: UserPersonalizationConfigType | undefined
): string {
  const userPersonalizationMessageContent: string[] = [];

  if (userPersonalizationConfig) {
    if (userPersonalizationConfig.currentRole) {
      userPersonalizationMessageContent.push('<user_current_role>');
      userPersonalizationMessageContent.push(`${userPersonalizationConfig.currentRole}`);
      userPersonalizationMessageContent.push('</user_current_role>');
    }

    if (userPersonalizationConfig.customInstructions) {
      userPersonalizationMessageContent.push('<custom_instructions>');
      userPersonalizationMessageContent.push(`${userPersonalizationConfig.customInstructions}`);
      userPersonalizationMessageContent.push('</custom_instructions>');
    }

    if (userPersonalizationConfig.additionalInformation) {
      userPersonalizationMessageContent.push('<additional_information>');
      userPersonalizationMessageContent.push(`${userPersonalizationConfig.additionalInformation}`);
      userPersonalizationMessageContent.push('</additional_information>');
    }
  }

  return userPersonalizationMessageContent.join('\n');
}
