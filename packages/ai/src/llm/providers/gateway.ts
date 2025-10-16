import { createGateway } from '@ai-sdk/gateway';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

// Provider-specific option types
export type GatewayProviderOrder = string[];

export type AnthropicOptions = {
  cacheControl?: { type: 'ephemeral' };
  thinking?: {
    type: 'enabled';
    budgetTokens: number;
  };
};

export type BedrockOptions = {
  cachePoint?: { type: 'default' };
  additionalModelRequestFields?: {
    anthropic_beta?: string[];
    reasoning_config?: {
      type: 'enabled';
      budget_tokens: number;
    };
  };
};

export type OpenAIOptions = {
  parallelToolCalls?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high' | 'minimal';
  verbosity?: 'low' | 'medium' | 'high';
  include?: string[];
  store?: boolean;
};

// Main provider options types
export type AnthropicProviderOptions = {
  gateway: {
    order: GatewayProviderOrder;
  };
  anthropic: AnthropicOptions;
  bedrock: BedrockOptions;
};

export type OpenAIProviderOptions = {
  gateway: {
    order: GatewayProviderOrder;
  };
  openai: OpenAIOptions;
};

// Default options with proper typing
export const DEFAULT_ANTHROPIC_OPTIONS: AnthropicProviderOptions = {
  gateway: {
    order: ['bedrock', 'anthropic', 'vertex'],
  },
  anthropic: {
    cacheControl: { type: 'ephemeral' },
  },
  bedrock: {
    cachePoint: { type: 'default' },
    additionalModelRequestFields: {
      anthropic_beta: ['fine-grained-tool-streaming-2025-05-14'],
    },
  },
};

export const DEFAULT_ANALYTICS_ENGINEER_OPTIONS = {
  gateway: {
    only: ['bedrock'],
  },
  openai: {
    parallelToolCalls: true,
    parallel_tool_calls: true,
    reasoningEffort: 'high',
    verbosity: 'low',
    include: ['reasoning.encrypted_content'],
    store: false,
  },
  anthropic: {
    cacheControl: { type: 'ephemeral' },
    thinking: {
      type: 'enabled',
      budgetTokens: 10000, // Set desired tokens for reasoning
    },
  },
  bedrock: {
    cachePoint: { type: 'default' },
    additionalModelRequestFields: {
      anthropic_beta: [
        'fine-grained-tool-streaming-2025-05-14',
        'interleaved-thinking-2025-05-14',
        'context-1m-2025-08-07',
      ],
      reasoning_config: {
        type: 'enabled',
        budget_tokens: 10000, // Adjust as needed
      },
    },
  },
};

export const DEFAULT_OPENAI_OPTIONS: OpenAIProviderOptions = {
  gateway: {
    order: ['openai'],
  },
  openai: {
    // parallelToolCalls: false,
    reasoningEffort: 'minimal',
    verbosity: 'low',
  },
};

// Create gateway instance
const gateway = createGateway({
  ...(process.env.AI_GATEWAY_API_KEY && { apiKey: process.env.AI_GATEWAY_API_KEY }),
});

// Export raw gateway for use in proxy endpoint (no middleware to avoid double logging)
export { gateway };

// Export a function that creates wrapped models with Braintrust middleware
export const gatewayModel = (modelId: string) => {
  return wrapLanguageModel({
    model: gateway(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
