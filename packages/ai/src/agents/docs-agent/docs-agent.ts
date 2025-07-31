import {} from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import {
  bashExecute,
  checkOffTodoList,
  createFiles,
  deleteFiles,
  editFiles,
  executeSqlDocsAgent,
  grepSearch,
  idleTool,
  listFiles,
  readFiles,
  sequentialThinking,
  updateClarificationsFile,
  webSearch,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';

const DEFAULT_OPTIONS = {
  maxSteps: 100,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
  },
};

export const docsAgent = new Agent({
  name: 'Docs Agent',
  instructions: '', // We control the system messages in the step at stream instantiation
  model: Sonnet4,
  tools: {
    sequentialThinking,
    grepSearch,
    readFiles,
    editFiles,
    createFiles,
    deleteFiles,
    listFiles,
    executeSql: executeSqlDocsAgent, // Use the docs-specific SQL tool that operates as a
    bashExecute,
    updateClarificationsFile,
    checkOffTodoList,
    idleTool,
    webSearch,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
