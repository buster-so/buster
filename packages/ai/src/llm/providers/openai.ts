import { createOpenAI } from '@ai-sdk/openai';
import { AI_KEYS, getSecret } from '@buster/secrets';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

export const openaiModel = async (modelId: string) => {
  const openai = createOpenAI({
    apiKey: await getSecret(AI_KEYS.OPENAI_API_KEY),
  });

  // Wrap the model with Braintrust middleware
  return wrapLanguageModel({
    model: openai(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
