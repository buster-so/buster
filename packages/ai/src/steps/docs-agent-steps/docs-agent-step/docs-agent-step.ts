import type { Sandbox } from '@buster/sandbox';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { createDocsAgent } from '../../../agents/docs-agent/docs-agent';
import { DocsAgentContextSchema } from '../../../agents/docs-agent/docs-agent-context';

// Zod schemas first - following Zod-first approach
export const DocsAgentStepInputSchema = z.object({
  todos: z.string().describe('The todos string'),
  todoList: z.string().describe('The TODO list'),
  message: z.string().describe('The user message'),
  messageId: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
  repositoryTree: z.string().describe('The tree structure of the repository'),
});

export const DocsAgentStepOutputSchema = z.object({
  todos: z.array(z.string()).optional().describe('Array of todos'),
  todoList: z.string().optional().describe('The TODO list'),
  documentationCreated: z.boolean().optional().describe('Whether documentation was created'),
  clarificationNeeded: z.boolean().optional().describe('Whether clarification is needed'),
  clarificationQuestion: z
    .object({
      issue: z.string(),
      context: z.string(),
      clarificationQuestion: z.string(),
    })
    .optional()
    .describe('Clarification question details'),
  finished: z.boolean().optional().describe('Whether the agent finished'),
  metadata: z
    .object({
      filesCreated: z.number().optional(),
      toolsUsed: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Metadata about the execution'),
});

// Export types from schemas
export type DocsAgentStepInput = z.infer<typeof DocsAgentStepInputSchema>;
export type DocsAgentStepOutput = z.infer<typeof DocsAgentStepOutputSchema>;

/**
 * Main documentation agent that processes todos and creates documentation
 */
export async function runDocsAgentStep(params: DocsAgentStepInput): Promise<void> {
  // Validate input
  const validatedParams = DocsAgentStepInputSchema.parse(params);

  // Extract values from context
  const sandbox = validatedParams.context.sandbox as Sandbox;
  const todoList = validatedParams.todoList;
  const dataSourceId = validatedParams.context.dataSourceId;

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

    // Create the docs agent with folder structure and context
    const docsAgent = createDocsAgent({
      fileTree: validatedParams.repositoryTree,
      userId: validatedParams.organizationId, // Using organizationId as userId for now
      chatId: Date.now().toString(), // Using current timestamp as chatId
      dataSourceId: dataSourceId || '',
      dataSourceSyntax: '', // Adding required field
      organizationId: validatedParams.organizationId || '',
      messageId: validatedParams.messageId, // Optional field
      sandbox: sandbox, // Pass sandbox for file tools
      todoList: todoList,
      clarifications: [],
    });

    const userMessage = `${validatedParams.message}`;
    const todoMessage = `<todo-list>\n${todoList}\n</todo-list>`;

    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: userMessage,
      },
      {
        role: 'user',
        content: todoMessage,
      },
    ];

    // Add cwd message if available (after todo list)
    if (cwdMessage) {
      messages.push({
        role: 'user',
        content: cwdMessage,
      });
    }

    // Execute the docs agent
    const result = await docsAgent.stream({ messages });

    // Wait for the response and extract tool calls
    const response = await result.response;

    if (!response || !Array.isArray(response.messages)) {
      throw new Error('Docs agent returned an invalid response shape (missing messages array)');
    }

    return;
  } catch (error) {
    console.error('[DocsAgent] Error executing docs agent:', error);
    throw new Error(
      `Docs agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
