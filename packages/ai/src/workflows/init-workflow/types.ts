import type { ModelMessage } from 'ai';
import { z } from 'zod';

export const InitWorkflowInputSchema = z.object({
  userId: z.string().uuid(),
  chatId: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  organizationId: z.string().uuid(),
  messageId: z.string().uuid(),
});

export const InitWorkflowOutputSchema = z.object({});

export type InitWorkflowInput = z.infer<typeof InitWorkflowInputSchema>;
export type InitWorkflowOutput = z.infer<typeof InitWorkflowOutputSchema>;
