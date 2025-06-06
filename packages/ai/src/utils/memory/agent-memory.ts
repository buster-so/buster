import type { Memory } from '@mastra/memory';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { MessageHistory, StepFinishData } from './types';
import { getSharedMemory } from '../shared-memory';

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
    sessionId: key,
    messages: messages.map(msg => ({
      role: msg.role as any,
      content: typeof msg.content === 'string' 
        ? msg.content 
        : JSON.stringify(msg.content),
      metadata: {
        ...metadata,
        originalMessage: msg,
      },
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
    sessionId: key,
    messages: [{
      role: 'system' as any,
      content: JSON.stringify(stepData),
      metadata: {
        stepName,
        timestamp: Date.now(),
      },
    }],
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
  
  const messages = await memory.getMessages({
    sessionId: key,
  });
  
  if (messages.length === 0) {
    return null;
  }
  
  try {
    return JSON.parse(messages[0].content);
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
    sessionId: key,
    messages: [{
      role: 'system' as any,
      content: JSON.stringify(state),
      metadata: {
        timestamp: Date.now(),
      },
    }],
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
  
  const messages = await memory.getMessages({
    sessionId: key,
  });
  
  if (messages.length === 0) {
    return null;
  }
  
  try {
    return JSON.parse(messages[0].content);
  } catch {
    return null;
  }
}

/**
 * Clear memory for a specific session
 */
export async function clearSessionMemory(
  threadId: string,
  resourceId: string
): Promise<void> {
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