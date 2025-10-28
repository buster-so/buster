import { z } from 'zod';
import { ModelQueueItemSchema } from '../build-models-queue-step/types';

export const GenerateInitDocsStepInputSchema = z.object({
  models: z.array(ModelQueueItemSchema).describe('Queue of models to document'),
  chatId: z.string().describe('Chat identifier'),
  messageId: z.string().describe('Message identifier'),
  userId: z.string().describe('User identifier'),
  organizationId: z.string().describe('Organization identifier'),
  dataSourceId: z.string().describe('Data source identifier'),
});

export type GenerateInitDocsStepInput = z.infer<typeof GenerateInitDocsStepInputSchema>;

export const ModelProcessingResultSchema = z.object({
  modelName: z.string().describe('Name of the model processed'),
  success: z.boolean().describe('Whether processing succeeded'),
  error: z.string().optional().describe('Error message if failed'),
});

export type ModelProcessingResult = z.infer<typeof ModelProcessingResultSchema>;
