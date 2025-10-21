import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import { createAnalyticsEngineerAgent } from '@buster/ai/agents/analytics-engineer-agent/analytics-engineer-agent';
import { proxyModel } from '@buster/ai/llm/providers/proxy-model';
import { z } from 'zod';
import { formatWorkingDirectoryContext } from '../utils/working-directory';

/**
 * Configuration for the proxy model connection
 */
export const ProxyConfigSchema = z.object({
  baseURL: z.string().url().describe('Base URL for the proxy server'),
  apiKey: z.string().describe('API key for authentication'),
  modelId: z.string().default('anthropic/claude-sonnet-4.5').describe('Model identifier'),
});

export type ProxyConfig = z.infer<typeof ProxyConfigSchema>;

/**
 * Parameters for creating an agent handler
 */
export const AgentHandlerParamsSchema = z.object({
  chatId: z.string().uuid().describe('Chat session identifier'),
  messageId: z.string().uuid().optional().describe('Message ID for tracking'),
  workingDirectory: z.string().describe('Working directory path'),
  userId: z.string().default('cli-user').describe('User identifier'),
  organizationId: z.string().default('cli').describe('Organization identifier'),
  dataSourceId: z.string().default('').describe('Data source identifier'),
  isInResearchMode: z.boolean().optional().describe('Research mode flag'),
  abortSignal: z.instanceof(AbortSignal).optional().describe('Abort controller signal'),
});

export type AgentHandlerParams = z.infer<typeof AgentHandlerParamsSchema>;

/**
 * Creates and configures an analytics engineer agent
 * Pure function that returns the configured agent
 */
export async function createConfiguredAgent(params: AgentHandlerParams, proxyConfig: ProxyConfig) {
  const validated = AgentHandlerParamsSchema.parse(params);
  const validatedProxy = ProxyConfigSchema.parse(proxyConfig);

  // Create proxy model with Braintrust middleware for observability
  // This logs all LLM calls at the CLI level (proxy model) rather than server level (gateway model)
  const model = proxyModel({
    baseURL: validatedProxy.baseURL,
    apiKey: validatedProxy.apiKey,
    modelId: validatedProxy.modelId,
  });

  // Create the analytics engineer agent with proxy model
  const agent = createAnalyticsEngineerAgent({
    folder_structure: formatWorkingDirectoryContext(validated.workingDirectory),
    userId: validated.userId,
    chatId: validated.chatId,
    dataSourceId: validated.dataSourceId,
    organizationId: validated.organizationId,
    messageId: validated.messageId || randomUUID(),
    todosList: [],
    model,
    abortSignal: validated.abortSignal,
    apiKey: validatedProxy.apiKey,
    apiUrl: validatedProxy.baseURL,
    isInResearchMode: validated.isInResearchMode || false,
  });

  return agent;
}

/**
 * Executes the agent with the given messages
 * Returns the stream for processing
 */
export async function executeAgent(
  params: AgentHandlerParams,
  proxyConfig: ProxyConfig,
  messages: ModelMessage[]
) {
  const agent = await createConfiguredAgent(params, proxyConfig);
  return agent.stream({ messages });
}
