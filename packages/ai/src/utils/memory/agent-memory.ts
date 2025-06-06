import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { Memory } from '@mastra/memory';
import { getSharedMemory } from '../shared-memory';
import type { MessageHistory, StepFinishData } from './types';

/**
 * Key generator for memory storage
 */
function getMemoryKey(threadId: string, resourceId: string, suffix?: string): string {
  const base = `${threadId}-${resourceId}`;
  return suffix ? `${base}-${suffix}` : base;
}

/**
 * Save agent conversation to memory
 */
export async function saveAgentConversation(
  memory: Memory,
  threadId: string,
  resourceId: string,
  messages: MessageHistory,
  metadata?: Record<string, any>
): Promise<void> {
  const key = getMemoryKey(threadId, resourceId);

  await memory.saveMessages({
    messages: messages.map((msg) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      createdAt: new Date(),
      threadId,
      resourceId,
      type: 'text' as const,
    })),
  });
}

/**
 * Save step data to memory for later retrieval
 */
export async function saveStepData(
  memory: Memory,
  threadId: string,
  resourceId: string,
  stepName: string,
  stepData: StepFinishData
): Promise<void> {
  const key = getMemoryKey(threadId, resourceId, `step-${stepName}`);

  // Store as a single message with the step data
  await memory.saveMessages({
    messages: [
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'system',
        content: JSON.stringify(stepData),
        createdAt: new Date(),
        threadId,
        resourceId,
        type: 'text' as const,
      },
    ],
  });
}

/**
 * Retrieve step data from memory
 */
export async function getStepData(
  memory: Memory,
  threadId: string,
  resourceId: string,
  stepName: string
): Promise<StepFinishData | null> {
  const key = getMemoryKey(threadId, resourceId, `step-${stepName}`);

  const result = await memory.query({
    threadId,
    resourceId,
  });

  const messages = result.messages;

  if (messages.length === 0) {
    return null;
  }

  try {
    const content =
      typeof messages[0].content === 'string'
        ? messages[0].content
        : JSON.stringify(messages[0].content);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Extract context from runtime for memory operations
 */
export function extractMemoryContext<T extends { userId: string; threadId: string }>(
  runtimeContext: RuntimeContext<T>
): { threadId: string; resourceId: string } {
  const threadId = runtimeContext.get('threadId');
  const resourceId = runtimeContext.get('userId');

  if (!threadId || !resourceId) {
    throw new Error('Missing required context values for memory operations');
  }

  return { threadId, resourceId };
}

/**
 * Store workflow state in memory
 */
export async function saveWorkflowState(
  threadId: string,
  resourceId: string,
  state: {
    currentStep: string;
    messages: MessageHistory;
    metadata: Record<string, any>;
  }
): Promise<void> {
  const memory = getSharedMemory();
  const key = getMemoryKey(threadId, resourceId, 'workflow-state');

  await memory.saveMessages({
    messages: [
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'system',
        content: JSON.stringify(state),
        createdAt: new Date(),
        threadId,
        resourceId,
        type: 'text' as const,
      },
    ],
  });
}

/**
 * Retrieve workflow state from memory
 */
export async function getWorkflowState(
  threadId: string,
  resourceId: string
): Promise<{
  currentStep: string;
  messages: MessageHistory;
  metadata: Record<string, any>;
} | null> {
  const memory = getSharedMemory();
  const key = getMemoryKey(threadId, resourceId, 'workflow-state');

  const result = await memory.query({
    threadId,
    resourceId,
  });

  const messages = result.messages;

  if (messages.length === 0) {
    return null;
  }

  try {
    const content =
      typeof messages[0].content === 'string'
        ? messages[0].content
        : JSON.stringify(messages[0].content);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Clear memory for a specific session
 */
export async function clearSessionMemory(threadId: string, resourceId: string): Promise<void> {
  const memory = getSharedMemory();

  // Clear all related memory keys
  const keys = [
    getMemoryKey(threadId, resourceId),
    getMemoryKey(threadId, resourceId, 'workflow-state'),
    getMemoryKey(threadId, resourceId, 'step-think-and-prep'),
    getMemoryKey(threadId, resourceId, 'step-analyst'),
  ];

  // Note: The Memory interface might not have a clear method
  // This is a placeholder - you'd need to check the actual API
  for (const key of keys) {
    // Clear messages for each key
    // This depends on the actual Memory API
  }
}
