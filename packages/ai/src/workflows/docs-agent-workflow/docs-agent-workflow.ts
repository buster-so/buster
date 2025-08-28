import type { Sandbox } from '@buster/sandbox';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import {
  /* runCreateDocsTodosStep, */ runDocsAgentStep,
  runGetRepositoryTreeStep,
} from '../../steps';

// Input schema for the workflow - matching analyst-workflow structure
export const DocsAgentWorkflowInputSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
  messageId: z.string().uuid(),
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  sandbox: z.custom<Sandbox>(
    (val) => {
      return val && typeof val === 'object' && 'id' in val && 'fs' in val;
    },
    {
      message: 'Invalid Sandbox instance',
    }
  ),
});

// Output schema for the workflow
export const DocsAgentWorkflowOutputSchema = z.object({
  workflowId: z.string(),
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dataSourceId: z.string().uuid(),

  startTime: z.number(),
  endTime: z.number(),
  totalExecutionTimeMs: z.number(),

  messages: z.array(z.custom<ModelMessage>()),

  todos: z.string().optional().describe('The TODO list'),
  notepad: z.string().optional().describe('The notepad contents'),
  repositoryTree: z.string().optional().describe('The repository tree structure'),
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

  summary: z.object({
    filesCreated: z.number().optional(),
    filesModified: z.number().optional(),
    toolsUsed: z.array(z.string()).optional(),
  }),
});

export type DocsAgentWorkflowInput = z.infer<typeof DocsAgentWorkflowInputSchema>;
export type DocsAgentWorkflowOutput = z.infer<typeof DocsAgentWorkflowOutputSchema>;

/**
 * Runs the documentation agent workflow
 * This workflow processes documentation requests through multiple steps:
 * 1. Get repository tree structure
 * 2. Create TODO list for documentation tasks
 * 3. Execute the docs agent to create documentation
 */
export const runDocsAgentWorkflow = wrapTraced(
  async (input: DocsAgentWorkflowInput): Promise<DocsAgentWorkflowOutput> => {
    const workflowStartTime = Date.now();
    const workflowId = `workflow_${input.chatId}_${input.messageId}`;

    // Validate input
    const validatedInput = DocsAgentWorkflowInputSchema.parse(input);

    const { messages, sandbox, dataSourceId } = validatedInput;

    // Step 1: Get repository tree structure
    // This step loads the file tree from the sandbox
    const treeResult = await runGetRepositoryTreeStep({
      message: messages[messages.length - 1]?.content?.toString() || '',
      organizationId: validatedInput.organizationId,
      contextInitialized: true,
      context: {
        sandbox: sandbox,
        todoList: '',
        notepad: '',
        clarificationQuestions: [],
        dataSourceId: dataSourceId,
      },
    });

    // Step 2: Create todos based on the messages and repository structure
    // const todosResult = await runCreateDocsTodosStep({
    //   messages,
    //   repositoryTree: treeResult.repositoryTree,
    // });

    // Add the todos message to the messages array
    // messages.push(todosResult.todosMessage);

    // Step 3: Execute the docs agent with all the prepared data
    const _agentResult = await runDocsAgentStep({
      todos: '', // todosResult.todos,
      todoList: '', // todosResult.todos,
      notepad: '', // Initialize empty notepad
      message: messages[messages.length - 1]?.content?.toString() || '',
      messageId: validatedInput.messageId,
      organizationId: validatedInput.organizationId,
      context: {
        sandbox: sandbox,
        todoList: '', // todosResult.todos,
        notepad: '', // Initialize empty notepad in context
        clarificationQuestions: [],
        dataSourceId: dataSourceId,
      },
      repositoryTree: treeResult.repositoryTree,
    });

    const workflowEndTime = Date.now();

    // Construct the comprehensive output
    const output: DocsAgentWorkflowOutput = {
      workflowId,
      chatId: input.chatId,
      messageId: input.messageId,
      userId: input.userId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,

      startTime: workflowStartTime,
      endTime: workflowEndTime,
      totalExecutionTimeMs: workflowEndTime - workflowStartTime,

      messages,

      todos: '', // todosResult.todos,
      notepad: '', // TODO: Extract from agent result
      repositoryTree: treeResult.repositoryTree,
      documentationCreated: true, // TODO: Extract from agent result
      clarificationNeeded: false, // TODO: Extract from agent result
      finished: true, // TODO: Extract from agent result

      summary: {
        filesCreated: 0, // TODO: Extract from agent result
        filesModified: 0, // TODO: Extract from agent result
        toolsUsed: [], // TODO: Extract from agent result
      },
    };

    return output;
  },
  { name: 'Docs Agent Workflow' }
);

// Default export for backward compatibility if needed
export default runDocsAgentWorkflow;
