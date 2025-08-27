import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { GPT5 } from '../../llm/gpt-5';
import {
  createBashTool,
  createDeleteFilesTool,
  createEditFilesTool,
  createGrepSearchTool,
  createIdleTool,
  createListFilesTool,
  createReadFilesTool,
  createSequentialThinkingTool,
  createUpdateClarificationsFileTool,
  createUpdateTodoListTool,
  createWebSearchTool,
  createWriteFilesTool,
} from '../../tools';
import { IDLE_TOOL_NAME } from '../../tools/communication-tools/idle-tool/idle-tool';
import {
  SUPER_EXECUTE_SQL_TOOL_NAME,
  createSuperExecuteSqlTool,
} from '../../tools/database-tools/super-execute-sql/super-execute-sql';
import { BASH_TOOL_NAME } from '../../tools/file-tools/bash-tool/bash-tool';
import { DELETE_FILES_TOOL_NAME } from '../../tools/file-tools/delete-files-tool/delete-files-tool';
import { EDIT_FILES_TOOL_NAME } from '../../tools/file-tools/edit-files-tool/edit-files-tool';
import { GREP_SEARCH_TOOL_NAME } from '../../tools/file-tools/grep-search-tool/grep-search-tool';
import { LIST_FILES_TOOL_NAME } from '../../tools/file-tools/list-files-tool/list-files-tool';
import { READ_FILES_TOOL_NAME } from '../../tools/file-tools/read-files-tool/read-files-tool';
import { WRITE_FILES_TOOL_NAME } from '../../tools/file-tools/write-files-tool/write-files-tool';
import { SEQUENTIAL_THINKING_TOOL_NAME } from '../../tools/planning-thinking-tools/sequential-thinking-tool/sequential-thinking-tool';
import { UPDATE_CLARIFICATIONS_FILE_TOOL_NAME } from '../../tools/planning-thinking-tools/update-clarifications-file-tool/update-clarifications-file-tool';
import { ClarifyingQuestionSchema } from '../../tools/planning-thinking-tools/update-clarifications-file-tool/update-clarifications-file-tool-execute';
import { UPDATE_TODO_LIST_TOOL_NAME } from '../../tools/planning-thinking-tools/update-todo-list-tool/update-todo-list-tool';
import { WEB_SEARCH_TOOL_NAME } from '../../tools/web-tools/web-search-tool';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { getDocsAgentFileTreeSystemPrompt } from './get-docs-agent-file-tree-system-prompt';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

export const DOCS_AGENT_NAME = 'docsAgent';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
  openai: {
    parallelToolCalls: false,
    reasoningEffort: 'medium',
  },
};

const STOP_CONDITIONS = [stepCountIs(50), hasToolCall(IDLE_TOOL_NAME)];

export const DocsAgentOptionsSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  sandbox: z.custom<Sandbox>(
    (val) => {
      return val && typeof val === 'object' && 'id' in val && 'fs' in val;
    },
    { message: 'Invalid Sandbox instance' }
  ),
  fileTree: z.string().describe('The file tree of the dbt repository'),
  todoList: z.string().default('').describe('The current todo list in markdown format'),
  clarifications: z
    .array(ClarifyingQuestionSchema)
    .default([])
    .describe('Current clarification questions'),
});

const DocsAgentStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type DocsAgentOptions = z.infer<typeof DocsAgentOptionsSchema>;
export type DocsAgentStreamOptions = z.infer<typeof DocsAgentStreamOptionsSchema>;

// Extended type for passing to tools (includes sandbox)
export type DocsAgentContextWithSandbox = DocsAgentOptions & { sandbox: Sandbox };

export function createDocsAgent(docsAgentOptions: DocsAgentOptions) {
  const systemMessage = {
    role: 'system',
    content: getDocsAgentSystemPrompt(),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  const fileTreeSystemMessage = {
    role: 'system',
    content: getDocsAgentFileTreeSystemPrompt(docsAgentOptions.fileTree),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  const tools = {
    [IDLE_TOOL_NAME]: createIdleTool(),
    [BASH_TOOL_NAME]: createBashTool(docsAgentOptions),
    [WRITE_FILES_TOOL_NAME]: createWriteFilesTool(docsAgentOptions),
    [DELETE_FILES_TOOL_NAME]: createDeleteFilesTool(docsAgentOptions),
    [EDIT_FILES_TOOL_NAME]: createEditFilesTool(docsAgentOptions),
    [GREP_SEARCH_TOOL_NAME]: createGrepSearchTool(docsAgentOptions),
    [LIST_FILES_TOOL_NAME]: createListFilesTool(docsAgentOptions),
    [READ_FILES_TOOL_NAME]: createReadFilesTool(docsAgentOptions),
    [WEB_SEARCH_TOOL_NAME]: createWebSearchTool(),
    [SUPER_EXECUTE_SQL_TOOL_NAME]: createSuperExecuteSqlTool(docsAgentOptions),
    [UPDATE_TODO_LIST_TOOL_NAME]: createUpdateTodoListTool(docsAgentOptions),
    [UPDATE_CLARIFICATIONS_FILE_TOOL_NAME]: createUpdateClarificationsFileTool(docsAgentOptions),
  };

  const agentContext: AgentContext = {
    agentName: DOCS_AGENT_NAME,
    availableTools: Object.keys(tools),
  };

  async function stream({ messages }: DocsAgentStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: GPT5,
          tools,
          messages: [systemMessage, fileTreeSystemMessage, ...messages],
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
          onStepFinish: async (event) => {
            // Wait for all tool operations to complete before moving to next step
            // This ensures done tool's async operations complete before stream terminates
            console.info('Docs Agent Finished', {
              toolCalls: event.toolCalls?.length || 0,
              hasToolResults: !!event.toolResults,
            });
          },
          onFinish: () => {
            console.info('Analyst Agent finished');
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
