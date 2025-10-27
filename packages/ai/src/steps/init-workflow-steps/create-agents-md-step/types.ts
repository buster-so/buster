import { z } from 'zod';

export const CreateAgentsMdStepInputSchema = z.object({
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dataSourceId: z.string().uuid(),
});

export type CreateAgentsMdStepInput = z.infer<typeof CreateAgentsMdStepInputSchema>;
