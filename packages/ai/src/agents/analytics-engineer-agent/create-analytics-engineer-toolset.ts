import {
  BASH_TOOL_NAME,
  EDIT_FILE_TOOL_NAME,
  GLOB_TOOL_NAME,
  GREP_TOOL_NAME,
  LS_TOOL_NAME,
  MULTI_EDIT_FILE_TOOL_NAME,
  READ_FILE_TOOL_NAME,
  RETRIEVE_METADATA_TOOL_NAME,
  RUN_SQL_TOOL_NAME,
  TASK_TOOL_NAME,
  TODO_WRITE_TOOL_NAME,
  WRITE_FILE_TOOL_NAME,
  createBashTool,
  createEditFileTool,
  createGlobTool,
  createGrepTool,
  createLsTool,
  createMultiEditFileTool,
  createReadFileTool,
  createRetrieveMetadataTool,
  createRunSqlTool,
  createTaskTool,
  createTodoWriteTool,
  createWriteFileTool,
} from '../../tools';
import type { AgentFactory } from '../../tools/task-tools/task-tool/task-tool';
import { createAnalyticsEngineerAgent } from './analytics-engineer-agent';
import type { AnalyticsEngineerAgentOptions } from './types';

// Base read-only tools (always present)
type ReadOnlyTools = {
  grep: ReturnType<typeof createGrepTool>;
  glob: ReturnType<typeof createGlobTool>;
  read: ReturnType<typeof createReadFileTool>;
  bash: ReturnType<typeof createBashTool>;
  ls: ReturnType<typeof createLsTool>;
  runSql: ReturnType<typeof createRunSqlTool>;
  retrieveMetadata: ReturnType<typeof createRetrieveMetadataTool>;
  todoWrite: ReturnType<typeof createTodoWriteTool>;
};

// Write tools (excluded in research mode)
type WriteTools = {
  write: ReturnType<typeof createWriteFileTool>;
  edit: ReturnType<typeof createEditFileTool>;
  multiEdit: ReturnType<typeof createMultiEditFileTool>;
};

// Task tool (excluded for subagents)
type TaskTool = {
  task: ReturnType<typeof createTaskTool>;
};

// Actual toolset combinations based on isInResearchMode and isSubagent flags:
type SubagentResearchToolset = ReadOnlyTools; // Research subagent: read-only only
type MainAgentResearchToolset = ReadOnlyTools & TaskTool; // Research main: read-only + task
type SubagentToolset = ReadOnlyTools & WriteTools; // Subagent: read-only + write
type MainAgentToolset = ReadOnlyTools & WriteTools & TaskTool; // Main agent: all tools

export async function createAnalyticsEngineerToolset(
  analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions
): Promise<
  SubagentResearchToolset | MainAgentResearchToolset | SubagentToolset | MainAgentToolset
> {
  const { messageId, folder_structure, isInResearchMode, isSubagent, chatId, todosList } =
    analyticsEngineerAgentOptions;

  // Helper to create task tool (avoids duplication)
  const createTaskToolForAgent = () =>
    createTaskTool({
      messageId,
      projectDirectory: folder_structure,
      createAgent: ((options: Parameters<AgentFactory>[0]) => {
        return createAnalyticsEngineerAgent({
          ...options,
          model: analyticsEngineerAgentOptions.model,
          apiKey: analyticsEngineerAgentOptions.apiKey,
          apiUrl: analyticsEngineerAgentOptions.apiUrl,
          todosList: [],
          isSubagent: true,
          isInResearchMode,
        });
      }) as unknown as AgentFactory,
    });

  // Build read-only tools (always present)
  const readOnlyTools = {
    [GREP_TOOL_NAME]: createGrepTool({ messageId, projectDirectory: folder_structure }),
    [GLOB_TOOL_NAME]: createGlobTool({ messageId, projectDirectory: folder_structure }),
    [READ_FILE_TOOL_NAME]: createReadFileTool({ messageId, projectDirectory: folder_structure }),
    [BASH_TOOL_NAME]: createBashTool({
      messageId,
      projectDirectory: folder_structure,
      isInResearchMode,
    }),
    [LS_TOOL_NAME]: createLsTool({ messageId, projectDirectory: folder_structure }),
    [RUN_SQL_TOOL_NAME]: createRunSqlTool({
      apiKey: analyticsEngineerAgentOptions.apiKey || process.env.BUSTER_API_KEY || '',
      apiUrl:
        analyticsEngineerAgentOptions.apiUrl ||
        process.env.BUSTER_API_URL ||
        'http://localhost:3000',
    }),
    [RETRIEVE_METADATA_TOOL_NAME]: createRetrieveMetadataTool({
      apiKey: analyticsEngineerAgentOptions.apiKey || process.env.BUSTER_API_KEY || '',
      apiUrl:
        analyticsEngineerAgentOptions.apiUrl ||
        process.env.BUSTER_API_URL ||
        'http://localhost:3000',
    }),
    [TODO_WRITE_TOOL_NAME]: createTodoWriteTool({
      chatId,
      workingDirectory: folder_structure,
      todosList,
    }),
  };

  // Research mode: read-only tools only (conditionally add task tool)
  if (isInResearchMode) {
    if (isSubagent) {
      // Research subagent: read-only only
      return readOnlyTools;
    }
    // Research main agent: read-only + task
    return {
      ...readOnlyTools,
      [TASK_TOOL_NAME]: createTaskToolForAgent(),
    };
  }

  // Full mode: add write tools
  const writeTools = {
    [WRITE_FILE_TOOL_NAME]: createWriteFileTool({ messageId, projectDirectory: folder_structure }),
    [EDIT_FILE_TOOL_NAME]: createEditFileTool({ messageId, projectDirectory: folder_structure }),
    [MULTI_EDIT_FILE_TOOL_NAME]: createMultiEditFileTool({
      messageId,
      projectDirectory: folder_structure,
    }),
  };

  if (isSubagent) {
    // Full mode subagent: read-only + write
    return {
      ...readOnlyTools,
      ...writeTools,
    };
  }

  // Full mode main agent: all tools
  return {
    ...readOnlyTools,
    ...writeTools,
    [TASK_TOOL_NAME]: createTaskToolForAgent(),
  };
}
