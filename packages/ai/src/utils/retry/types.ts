import type { Agent } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StepResult, StreamTextResult, TextStreamPart, ToolSet } from 'ai';

/**
 * Type alias for Mastra Agent with framework-required any types
 * The any types are part of Mastra's Agent interface for tools and memory
 */
// biome-ignore lint/suspicious/noExplicitAny: Mastra Agent framework requires these any types
type MastraAgent = Agent<string, Record<string, any>, Record<string, any>>;

export interface RetryableError {
  type: 'no-such-tool' | 'invalid-tool-arguments' | 'empty-response' | 'rate-limit' | 'server-error' | 'network-timeout' | 'stream-interruption' | 'json-parse-error' | 'content-policy';
  originalError?: Error | unknown;
  healingMessage: CoreMessage;
}

export interface RetryConfig {
  maxRetries: number;
  onRetry?: (error: RetryableError, attemptNumber: number) => void;
}

export interface AgentStreamOptions<T extends ToolSet> {
  toolCallStreaming?: boolean;
  runtimeContext: RuntimeContext<unknown>;
  abortSignal?: AbortSignal;
  toolChoice?: 'auto' | 'required' | 'none';
  onStepFinish?: (step: StepResult<T>) => Promise<void>;
  onChunk?: (event: { chunk: TextStreamPart<T> }) => Promise<void> | void;
}

export interface RetryableAgentStreamParams<T extends ToolSet> {
  agent: MastraAgent;
  messages: CoreMessage[];
  options: AgentStreamOptions<T>;
  retryConfig?: RetryConfig;
}

export interface RetryResult<T extends ToolSet> {
  stream: StreamTextResult<T, unknown>;
  conversationHistory: CoreMessage[];
  retryCount: number;
}
