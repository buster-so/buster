import type { Sandbox } from '@buster/sandbox';
import { type CoreMessage, createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { docsAgent } from '../../agents/docs-agent/docs-agent';
import { getDocsInstructions } from '../../agents/docs-agent/docs-agent-instructions';
import { DocsAgentContextKeys, DocsAgentContextSchema } from '../../context/docs-agent-context';
import type { MessageUserClarifyingQuestion } from '../../context/docs-agent-context';
import { standardizeMessages } from '../../utils/standardizeMessages';

const docsAgentStepInputSchema = z.object({
  todos: z.string(),
  todoList: z.string(),
  message: z.string(),
  organizationId: z.string(),
  context: DocsAgentContextSchema,
  repositoryTree: z.string().describe('The tree structure of the repository'),
});

const docsAgentStepOutputSchema = z.object({
  todos: z.array(z.string()).optional(),
  todoList: z.string().optional(),
  documentationCreated: z.boolean().optional(),
  clarificationNeeded: z.boolean().optional(),
  clarificationQuestion: z
    .object({
      issue: z.string(),
      context: z.string(),
      clarificationQuestion: z.string(),
    })
    .optional(),
  finished: z.boolean().optional(),
  metadata: z
    .object({
      filesCreated: z.number().optional(),
      toolsUsed: z.array(z.string()).optional(),
    })
    .optional(),
});

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const docsAgentExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof docsAgentStepInputSchema>;
  runtimeContext: RuntimeContext;
}): Promise<z.infer<typeof docsAgentStepOutputSchema>> => {
  // Access values from runtime context
  const sandbox = runtimeContext.get(DocsAgentContextKeys.Sandbox) as Sandbox;
  const todoList = runtimeContext.get(DocsAgentContextKeys.TodoList) as string;
  const clarificationQuestion = runtimeContext.get(DocsAgentContextKeys.ClarificationQuestions) as
    | MessageUserClarifyingQuestion
    | undefined;

  // Also access standard workflow context
  const organizationId = runtimeContext.get('organizationId') as string;
  const workflowStartTime = runtimeContext.get('workflowStartTime') as number;
  const dataSourceId = runtimeContext.get('dataSourceId') as string;
  const dataSourceSyntax = runtimeContext.get('dataSourceSyntax') as string;

  // Create abort controller for handling idle tool
  const abortController = new AbortController();

  // Initialize tracking variables outside try block
  let documentationCreated = false;
  let clarificationNeeded = false;
  let filesCreated = 0;
  const toolsUsed = new Set<string>();
  let finished = false;

  console.info('[DocsAgent] Starting docs agent execution', {
    hasSandbox: !!sandbox,
    todoListLength: todoList?.length || 0,
    hasClarificationQuestion: !!clarificationQuestion,
    organizationId,
    workflowStartTime,
    dataSourceId,
    dataSourceSyntax,
  });

  try {
    // Get current working directory from sandbox
    let cwdMessage = '';
    if (sandbox) {
      try {
        const pwdResult = await sandbox.process.executeCommand('pwd');
        const currentDir = pwdResult.result.trim();
        cwdMessage = `cwd: ${currentDir}`;
      } catch (error) {
        console.warn('[DocsAgent] Failed to get current working directory:', error);
      }
    }

    // Get the docs agent instructions with the current date
    const instructions = getDocsInstructions();
    const repositoryStructure = `<repository-structure>\n${inputData.repositoryTree}\n</repository-structure>`;
    const userMessage = `${inputData.message}`;
    const todoMessage = `<todo-list>\n${todoList}\n</todo-list>`;

    const messages = [
      {
        role: 'system',
        content: instructions,
        providerOptions: DEFAULT_CACHE_OPTIONS,
      } as CoreMessage,
      {
        role: 'system',
        content: repositoryStructure,
        providerOptions: DEFAULT_CACHE_OPTIONS,
      } as CoreMessage,
      {
        role: 'user',
        content: userMessage,
      } as CoreMessage,
      {
        role: 'user',
        content: todoMessage,
      } as CoreMessage,
    ];

    // Add cwd message if available (after todo list)
    if (cwdMessage) {
      messages.push({
        role: 'user',
        content: cwdMessage,
      } as CoreMessage);
    }

    // Execute the docs agent
    const result = await docsAgent.stream(messages, {
      instructions,
      runtimeContext,
      toolChoice: 'required',
      maxSteps: 100, // Allow more steps for complex documentation tasks
      abortSignal: abortController.signal, // Add abort signal
    });

    // Process the stream to extract results
    let stepCount = 0;
    let lastTextContent = '';

    for await (const chunk of result.fullStream) {
      // Check if aborted
      if (abortController.signal.aborted) {
        break;
      }

      // Track step count
      if (chunk.type === 'step-start') {
        stepCount++;
        console.log(`[DocsAgent] Step ${stepCount} started`);
      }

      // Log text chunks to see what the agent is thinking
      if (chunk.type === 'text-delta' && chunk.textDelta) {
        lastTextContent += chunk.textDelta;
      }

      if (chunk.type === 'step-finish') {
        console.log(
          `[DocsAgent] Step ${stepCount} finished. Last text: ${lastTextContent.slice(0, 200)}...`
        );
        lastTextContent = '';
      }

      // Track tool usage
      if (chunk.type === 'tool-call') {
        console.log(
          `[DocsAgent] Tool call: ${chunk.toolName} with args:`,
          JSON.stringify(chunk.args).slice(0, 200)
        );
        toolsUsed.add(chunk.toolName);

        // Track specific tool outcomes
        if (chunk.toolName === 'createFiles' || chunk.toolName === 'editFiles') {
          console.log(
            `[DocsAgent] Tool ${chunk.toolName} called - marking documentationCreated = true`
          );
          documentationCreated = true;
          filesCreated++;
        }

        if (chunk.toolName === 'updateClarificationsFile') {
          clarificationNeeded = true;
        }

        if (chunk.toolName === 'idleTool') {
          console.log('[DocsAgent] Idle tool called - aborting stream');
          finished = true;
          abortController.abort();
        }
      }

      // Check for clarification updates in tool results
      if (chunk.type === 'tool-result') {
        if (chunk.toolName === 'updateClarificationsFile' && chunk.result) {
          // Update the runtime context with any new clarification questions
          const resultData = chunk.result as Record<string, unknown>;
          if (resultData.clarificationQuestion) {
            runtimeContext.set(
              DocsAgentContextKeys.ClarificationQuestions,
              resultData.clarificationQuestion
            );
          }
        }
      }
    }

    // Get the final todo list state
    const finalTodoList = runtimeContext.get(DocsAgentContextKeys.TodoList) as string;

    console.log('[DocsAgent] Final results:', {
      documentationCreated,
      filesCreated,
      toolsUsed: Array.from(toolsUsed),
      finished,
    });

    return {
      todos: inputData.todos.split('\n').filter((line) => line.trim()),
      todoList: finalTodoList || inputData.todoList,
      documentationCreated,
      clarificationNeeded,
      finished,
      metadata: {
        filesCreated,
        toolsUsed: Array.from(toolsUsed),
      },
    };
  } catch (error) {
    // Handle abort error gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      console.info('[DocsAgent] Stream aborted successfully (idle tool called)');

      // Get the final todo list state
      const finalTodoList = runtimeContext.get(DocsAgentContextKeys.TodoList) as string;

      return {
        todos: inputData.todos.split('\n').filter((line) => line.trim()),
        todoList: finalTodoList || inputData.todoList,
        documentationCreated,
        clarificationNeeded,
        finished: true,
        metadata: {
          filesCreated,
          toolsUsed: Array.from(toolsUsed),
        },
      };
    }

    console.error('[DocsAgent] Error executing docs agent:', error);
    throw new Error(
      `Docs agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const docsAgentStep = createStep({
  id: 'docs-agent',
  description: 'Main documentation agent that processes todos and creates documentation',
  inputSchema: docsAgentStepInputSchema,
  outputSchema: docsAgentStepOutputSchema,
  execute: docsAgentExecution,
});
