import type { PermissionedDataset } from '@buster/access-controls';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm';
import { createExecuteSqlTool, createSequentialThinkingTool } from '../../tools';
import {
  MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
  createMessageUserClarifyingQuestionTool,
} from '../../tools/communication-tools/message-user-clarifying-question/message-user-clarifying-question';
import {
  RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
  createRespondWithoutAssetCreationTool,
} from '../../tools/communication-tools/respond-without-asset-creation/respond-without-asset-creation-tool';
import {
  SUBMIT_THOUGHTS_TOOL_NAME,
  createSubmitThoughtsTool,
} from '../../tools/communication-tools/submit-thoughts-tool/submit-thoughts-tool';
import { EXECUTE_SQL_TOOL_NAME } from '../../tools/database-tools/execute-sql/execute-sql';
import { SEQUENTIAL_THINKING_TOOL_NAME } from '../../tools/planning-thinking-tools/sequential-thinking-tool/sequential-thinking-tool';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import {
  type AnalysisMode,
  getThinkAndPrepAgentSystemPrompt,
} from './get-think-and-prep-agent-system-prompt';

export const THINK_AND_PREP_AGENT_NAME = 'thinkAndPrepAgent';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
  openai: {
    parallelToolCalls: false,
    reasoningEffort: 'minimal',
  },
};

const STOP_CONDITIONS = [
  stepCountIs(25),
  hasToolCall(SUBMIT_THOUGHTS_TOOL_NAME),
  hasToolCall(RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME),
  hasToolCall(MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME),
];

export const ThinkAndPrepAgentOptionsSchema = z.object({
  sql_dialect_guidance: z
    .string()
    .describe('The SQL dialect guidance for the think and prep agent.'),
  messageId: z.string().describe('The message ID for tracking tool execution.'),
  chatId: z.string().describe('The chat ID for tracking tool execution.'),
  organizationId: z.string().describe('The organization ID for tracking tool execution.'),
  dataSourceId: z.string().describe('The data source ID for tracking tool execution.'),
  dataSourceSyntax: z.string().describe('The data source syntax for tracking tool execution.'),
  userId: z.string().describe('The user ID for tracking tool execution.'),
  datasets: z
    .array(z.custom<PermissionedDataset>())
    .describe('The datasets available to the user.'),
  analysisMode: z
    .enum(['standard', 'investigation'])
    .default('standard')
    .describe('The analysis mode to determine which prompt to use.')
    .optional(),
  workflowStartTime: z.number().describe('The start time of the workflow'),
});

export const ThinkAndPrepStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the think and prep agent.'),
});

export type ThinkAndPrepAgentOptions = z.infer<typeof ThinkAndPrepAgentOptionsSchema>;
export type ThinkAndPrepStreamOptions = z.infer<typeof ThinkAndPrepStreamOptionsSchema>;

export function createThinkAndPrepAgent(thinkAndPrepAgentSchema: ThinkAndPrepAgentOptions) {
  const { messageId, datasets, workflowStartTime } = thinkAndPrepAgentSchema;

  const systemMessage = {
    role: 'system',
    content: getThinkAndPrepAgentSystemPrompt(
      thinkAndPrepAgentSchema.sql_dialect_guidance,
      (thinkAndPrepAgentSchema.analysisMode || 'standard') as AnalysisMode
    ),
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

  async function stream({ messages }: ThinkAndPrepStreamOptions) {
    const sequentialThinking = createSequentialThinkingTool({ messageId });
    const executeSqlTool = createExecuteSqlTool({
      messageId,
      dataSourceId: thinkAndPrepAgentSchema.dataSourceId,
      dataSourceSyntax: thinkAndPrepAgentSchema.dataSourceSyntax,
      userId: thinkAndPrepAgentSchema.userId,
    });
    const respondWithoutAssetCreation = createRespondWithoutAssetCreationTool({
      messageId,
      workflowStartTime,
    });
    const submitThoughts = createSubmitThoughtsTool();
    const messageUserClarifyingQuestion = createMessageUserClarifyingQuestionTool({
      messageId,
      workflowStartTime,
    });

    const availableTools = [
      SEQUENTIAL_THINKING_TOOL_NAME,
      EXECUTE_SQL_TOOL_NAME,
      RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
      SUBMIT_THOUGHTS_TOOL_NAME,
      MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
    ];

    const agentContext: AgentContext = {
      agentName: THINK_AND_PREP_AGENT_NAME,
      availableTools,
      nextPhaseTools: [
        'createMetrics',
        'modifyMetrics',
        'createDashboards',
        'modifyDashboards',
        'createReports',
        'modifyReports',
        'doneTool',
      ],
    };

    return wrapTraced(
      async () =>
        streamText({
          model: await Sonnet4,
          tools: {
            [SEQUENTIAL_THINKING_TOOL_NAME]: sequentialThinking,
            [EXECUTE_SQL_TOOL_NAME]: executeSqlTool,
            [RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME]: respondWithoutAssetCreation,
            [SUBMIT_THOUGHTS_TOOL_NAME]: submitThoughts,
            [MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME]: messageUserClarifyingQuestion,
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
          onStepFinish: async (event) => {
            console.info('Think and Prep Agent step finished', {
              toolCalls: event.toolCalls?.length || 0,
              hasToolResults: !!event.toolResults,
            });
          },
        }),
      {
        name: 'Think and Prep Agent',
      }
    )();
  }

  return {
    stream,
  };
}
