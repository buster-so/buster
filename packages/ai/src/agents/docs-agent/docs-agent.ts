import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm/sonnet-4';
import {
  createBashTool,
  createCheckOffTodoListTool,
  createCreateFilesTool,
  createDeleteFilesTool,
  createEditFilesTool,
  createGrepSearchTool,
  createIdleTool,
  createListFilesTool,
  createReadFilesTool,
  createSequentialThinkingTool,
  createUpdateClarificationsFileTool,
  createWebSearchTool,
  executeSqlDocsAgent,
} from '../../tools';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

export const DOCS_AGENT_NAME = 'docsAgent';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [stepCountIs(50), hasToolCall('idleTool')];

const DocsAgentOptionsSchema = z.object({
  folder_structure: z.string().describe('The file structure of the dbt repository'),
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'fs' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .optional(),
});

const DocsStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type DocsAgentOptions = z.infer<typeof DocsAgentOptionsSchema>;
export type DocsStreamOptions = z.infer<typeof DocsStreamOptionsSchema>;

// Extended type for passing to tools (includes sandbox)
export type DocsAgentContextWithSandbox = DocsAgentOptions & { sandbox: Sandbox };

export function createDocsAgent(docsAgentOptions: DocsAgentOptions) {
  const systemMessage = {
    role: 'system',
    content: getDocsAgentSystemPrompt(docsAgentOptions.folder_structure),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  const idleTool = createIdleTool();

  // Create tool context with messageId and sandbox if available
  // Create file tools with context (only if sandbox is available)
  const listFiles = docsAgentOptions.sandbox
    ? createListFilesTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;
  const readFiles = docsAgentOptions.sandbox
    ? createReadFilesTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;
  const createFiles = docsAgentOptions.sandbox
    ? createCreateFilesTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;
  const editFiles = docsAgentOptions.sandbox
    ? createEditFilesTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;
  const deleteFiles = docsAgentOptions.sandbox
    ? createDeleteFilesTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;
  const bashExecute = docsAgentOptions.sandbox
    ? createBashTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;
  const grepSearch = docsAgentOptions.sandbox
    ? createGrepSearchTool({
        messageId: docsAgentOptions.messageId || 'default',
        sandbox: docsAgentOptions.sandbox,
      })
    : undefined;

  const webSearch = createWebSearchTool();

  // Create planning tools with simple context
  const checkOffTodoList = createCheckOffTodoListTool({
    todoList: '',
    updateTodoList: () => {},
  });

  const updateClarificationsFile = createUpdateClarificationsFileTool({
    clarifications: [],
    updateClarifications: () => {},
  });

  async function stream({ messages }: DocsStreamOptions) {
    // Collect available tools dynamically based on what's enabled
    const availableTools: string[] = ['sequentialThinking'];
    if (grepSearch) availableTools.push('grepSearch');
    if (readFiles) availableTools.push('readFiles');
    if (editFiles) availableTools.push('editFiles');
    if (createFiles) availableTools.push('createFiles');
    if (deleteFiles) availableTools.push('deleteFiles');
    if (listFiles) availableTools.push('listFiles');
    availableTools.push('executeSql');
    if (bashExecute) availableTools.push('bashExecute');
    availableTools.push('updateClarificationsFile', 'checkOffTodoList', 'idleTool', 'webSearch');

    const agentContext: AgentContext = {
      agentName: DOCS_AGENT_NAME,
      availableTools,
    };

    return wrapTraced(
      async () =>
        streamText({
          model: await Sonnet4,
          tools: {
            sequentialThinking: createSequentialThinkingTool({
              messageId: docsAgentOptions.messageId,
            }),
            ...(grepSearch && { grepSearch }),
            ...(readFiles && { readFiles }),
            ...(editFiles && { editFiles }),
            ...(createFiles && { createFiles }),
            ...(deleteFiles && { deleteFiles }),
            ...(listFiles && { listFiles }),
            executeSql: executeSqlDocsAgent,
            ...(bashExecute && { bashExecute }),
            updateClarificationsFile,
            checkOffTodoList,
            idleTool,
            webSearch,
          },
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
          experimental_context: docsAgentOptions,
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
        }),
      {
        name: 'Docs Agent',
      }
    )();
  }

  return {
    stream,
  };
}
