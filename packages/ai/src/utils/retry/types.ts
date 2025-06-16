import type { Agent } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StepResult, StreamTextResult, TextStreamPart, ToolSet } from 'ai';

export interface RetryableError {
  type: 'no-such-tool' | 'invalid-tool-arguments' | 'empty-response';
  originalError?: Error | unknown;
  healingMessage: CoreMessage;
}

export interface RetryConfig {
  maxRetries: number;
  onRetry?: (error: RetryableError, attemptNumber: number) => void;
}

export interface AgentStreamOptions<T extends ToolSet> {
  runtimeContext: RuntimeContext<unknown>;
  abortSignal?: AbortSignal;
  toolChoice?: 'auto' | 'required' | 'none';
  onStepFinish?: (step: StepResult<T>) => Promise<void>;
  onChunk?: (event: { chunk: TextStreamPart<T> }) => Promise<void> | void;
}

export interface RetryableAgentStreamParams<T extends ToolSet> {
  agent: Agent<string, any, any>;
  messages: CoreMessage[];
  options: AgentStreamOptions<T>;
  retryConfig?: RetryConfig;
}

export interface RetryResult<T extends ToolSet> {
  stream: StreamTextResult<T, unknown>;
  conversationHistory: CoreMessage[];
  retryCount: number;
}
