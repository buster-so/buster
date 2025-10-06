import { createGateway } from '@ai-sdk/gateway';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

// Provider-specific option types
export type GatewayProviderOrder = string[];

export type AnthropicOptions = {
  cacheControl?: { type: 'ephemeral' };
};

export type BedrockOptions = {
  cachePoint?: { type: 'default' };
  additionalModelRequestFields?: {
    anthropic_beta?: string[];
  };
};

export type OpenAIOptions = {
  // parallelToolCalls?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high' | 'minimal';
  verbosity?: 'low' | 'medium' | 'high';
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

// Export a function that creates wrapped models with Braintrust middleware
export const gatewayModel = (modelId: string) => {
  return wrapLanguageModel({
    model: gateway(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
