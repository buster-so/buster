import type { PermissionedDataset } from '@buster/access-controls';
import { waitForPendingUpdates } from '@buster/database/queries';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../llm/providers/gateway';
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
import { AnalysisModeSchema } from '../../types/analysis-mode.types';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { analystAgentPrepareStep } from './analyst-agent-prepare-step';
import { getAnalystAgentSystemPrompt } from './get-analyst-agent-system-prompt';

export const ANALYST_AGENT_NAME = 'analystAgent';

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
  analysisMode: AnalysisModeSchema.optional().describe('The analysis mode for the workflow'),
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
  userPersonalizationMessageContent: z
    .string()
    .describe('Custom user personalization in message content'),
});

export const AnalystStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the analyst agent.'),
});

export type AnalystAgentOptions = z.infer<typeof AnalystAgentOptionsSchema>;
export type AnalystStreamOptions = z.infer<typeof AnalystStreamOptionsSchema>;

export function createAnalystAgent(analystAgentOptions: AnalystAgentOptions) {
  const { datasets, analystInstructions, organizationDocs, userPersonalizationMessageContent } =
    analystAgentOptions;

  const systemMessage = {
    role: 'system',
    content: getAnalystAgentSystemPrompt(analystAgentOptions.dataSourceSyntax),
    providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
  } as ModelMessage;

  // Create second system message with datasets information
  const datasetsContent = datasets
    .filter((d) => d.ymlContent)
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort by name for consistency
    .map((d) => d.ymlContent)
    .join('\n\n');

  const datasetsSystemMessage = {
    role: 'system',
    content: datasetsContent
      ? `<datasets>\n${datasetsContent}\n</datasets>`
      : '<datasets>\nNo datasets available\n</datasets>',
    providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
  } as ModelMessage;

  // Create third system message with data catalog docs
  const docsContent = organizationDocs
    ?.sort((a, b) => a.name.localeCompare(b.name)) // Sort by name for consistency
    .map((doc) => `# ${doc.name}\n\n${doc.content}`)
    .join('\n\n---\n\n');

  const docsSystemMessage = docsContent
    ? ({
        role: 'system',
        content: `<data_catalog_docs>\n${docsContent}\n</data_catalog_docs>`,
        providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
      } as ModelMessage)
    : null;

  async function stream({ messages }: AnalystStreamOptions) {
    const createMetrics = createCreateMetricsTool(analystAgentOptions);
    const modifyMetrics = createModifyMetricsTool(analystAgentOptions);
    const createDashboards = createCreateDashboardsTool(analystAgentOptions);
    const modifyDashboards = createModifyDashboardsTool(analystAgentOptions);
    const createReports = createCreateReportsTool({
      ...analystAgentOptions,
      analysisMode: analystAgentOptions.analysisMode || 'standard',
    });
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

    // Create analyst instructions system message with proper escaping
    const analystInstructionsMessage = analystInstructions
      ? ({
          role: 'system',
          content: `<organization_instructions>\n${analystInstructions}\n</organization_instructions>`,
          providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
        } as ModelMessage)
      : null;

    // Create user personalization system message
    const userPersonalizationSystemMessage = userPersonalizationMessageContent
      ? ({
          role: 'system',
          content: userPersonalizationMessageContent,
          providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
        } as ModelMessage)
      : null;

    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
          headers: {
            'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14,context-1m-2025-08-07',
            anthropic_beta: 'fine-grained-tool-streaming-2025-05-14,context-1m-2025-08-07',
          },
          tools: {
            [CREATE_METRICS_TOOL_NAME]: createMetrics,
            [MODIFY_METRICS_TOOL_NAME]: modifyMetrics,
            [CREATE_DASHBOARDS_TOOL_NAME]: createDashboards,
            [MODIFY_DASHBOARDS_TOOL_NAME]: modifyDashboards,
            [CREATE_REPORTS_TOOL_NAME]: createReports,
            [MODIFY_REPORTS_TOOL_NAME]: modifyReports,
            [DONE_TOOL_NAME]: doneTool,
          },
          messages: [
            systemMessage,
            datasetsSystemMessage,
            ...(docsSystemMessage ? [docsSystemMessage] : []),
            ...(analystInstructionsMessage ? [analystInstructionsMessage] : []),
            ...(userPersonalizationSystemMessage ? [userPersonalizationSystemMessage] : []),
            ...messages,
          ],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 25000,
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
          onFinish: async () => {
            console.info('Analyst Agent finished');
            // Ensure all pending database updates complete before stream terminates
            await waitForPendingUpdates(analystAgentOptions.messageId);
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
