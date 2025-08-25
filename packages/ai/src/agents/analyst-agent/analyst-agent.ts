import type { PermissionedDataset } from '@buster/access-controls';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm';
import {
  createCreateDashboardsTool,
  createCreateMetricsTool,
  createCreateReportsTool,
  createDoneTool,
  createModifyDashboardsTool,
  createModifyMetricsTool,
  createModifyReportsTool,
} from '../../tools';
import { DONE_TOOL_NAME } from '../../tools/communication-tools/done-tool/done-tool';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { analystAgentPrepareStep } from './analyst-agent-prepare-step';
import { getAnalystAgentSystemPrompt } from './get-analyst-agent-system-prompt';

export const ANALYST_AGENT_NAME = 'analystAgent';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
  openai: {
    parallelToolCalls: false,
    reasoningEffort: 'minimal',
  },
};

const STOP_CONDITIONS = [stepCountIs(25), hasToolCall(DONE_TOOL_NAME)];

export const AnalystAgentOptionsSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  datasets: z.array(z.custom<PermissionedDataset>()),
  workflowStartTime: z.number(),
});

export const AnalystStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the analyst agent.'),
});

export type AnalystAgentOptions = z.infer<typeof AnalystAgentOptionsSchema>;
export type AnalystStreamOptions = z.infer<typeof AnalystStreamOptionsSchema>;

export function createAnalystAgent(analystAgentOptions: AnalystAgentOptions) {
  const { datasets } = analystAgentOptions;

  const systemMessage = {
    role: 'system',
    content: getAnalystAgentSystemPrompt(analystAgentOptions.dataSourceSyntax),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  // Create second system message with datasets information
  const datasetsContent = datasets
    .filter((d) => d.ymlContent)
    .map((d) => d.ymlContent)
    .join('\n\n');

  const datasetsSystemMessage = {
    role: 'system',
    content: datasetsContent
      ? `<database_context>\n${datasetsContent}\n</database_context>`
      : '<database_context>\nNo datasets available\n</database_context>',
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: AnalystStreamOptions) {
    const createMetrics = createCreateMetricsTool(analystAgentOptions);
    const modifyMetrics = createModifyMetricsTool(analystAgentOptions);
    const createDashboards = createCreateDashboardsTool(analystAgentOptions);
    const modifyDashboards = createModifyDashboardsTool(analystAgentOptions);
    const createReports = createCreateReportsTool(analystAgentOptions);
    const modifyReports = createModifyReportsTool(analystAgentOptions);
    const doneTool = createDoneTool(analystAgentOptions);

    const availableTools = [
      CREATE_METRICS_TOOL_NAME,
      MODIFY_METRICS_TOOL_NAME,
      CREATE_DASHBOARDS_TOOL_NAME,
      MODIFY_DASHBOARDS_TOOL_NAME,
      CREATE_REPORTS_TOOL_NAME,
      MODIFY_REPORTS_TOOL_NAME,
      DONE_TOOL_NAME,
    ];

    const agentContext: AgentContext = {
      agentName: ANALYST_AGENT_NAME,
      availableTools,
    };

    return wrapTraced(
      async () =>
        streamText({
          model: await Sonnet4,
          tools: {
            [CREATE_METRICS_TOOL_NAME]: createMetrics,
            [MODIFY_METRICS_TOOL_NAME]: modifyMetrics,
            [CREATE_DASHBOARDS_TOOL_NAME]: createDashboards,
            [MODIFY_DASHBOARDS_TOOL_NAME]: modifyDashboards,
            [CREATE_REPORTS_TOOL_NAME]: createReports,
            [MODIFY_REPORTS_TOOL_NAME]: modifyReports,
            [DONE_TOOL_NAME]: doneTool,
          },
          messages: [systemMessage, datasetsSystemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
          experimental_repairToolCall: async (repairContext) => {
            return repairToolCall({
              toolCall: repairContext.toolCall,
              tools: repairContext.tools,
              error: repairContext.error,
              messages: repairContext.messages,
              ...(repairContext.system && { system: repairContext.system }),
              ...(repairContext.inputSchema && { inputSchema: repairContext.inputSchema }),
              agentContext,
            });
          },
          prepareStep: analystAgentPrepareStep,
          onStepFinish: async (event) => {
            // Wait for all tool operations to complete before moving to next step
            // This ensures done tool's async operations complete before stream terminates
            console.info('Analyst Agent step finished', {
              toolCalls: event.toolCalls?.length || 0,
              hasToolResults: !!event.toolResults,
            });
          },
          onFinish: () => {
            console.info('Analyst Agent finished');
          },
        }),
      {
        name: 'Analyst Agent',
      }
    )();
  }

  return {
    stream,
  };
}
