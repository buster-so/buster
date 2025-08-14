import { createTool } from '@mastra/core';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const inputSchema = z
  .object({
    plan: z
      .string()
      .describe(
        'A full markdown investigation plan containing hypotheses, questions, data to investigate, and next steps. This should be updated over time.'
      )
      .optional(),
    hypotheses: z.array(z.string()).describe('Hypotheses to investigate').optional(),
    questions: z.array(z.string()).describe('Questions to investigate').optional(),
    dataToInvestigate: z
      .array(z.string())
      .describe(
        'Entities, tables, fields, or segments to investigate. Prefer concrete names like `database.schema.table.column`, or brief descriptors.'
      )
      .optional(),
    nextSteps: z.array(z.string()).describe('Immediate next investigation steps').optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.plan || data.hypotheses || data.questions || data.dataToInvestigate || data.nextSteps
      ),
    {
      message:
        'At least one of plan, hypotheses, questions, dataToInvestigate, or nextSteps must be provided.',
    }
  );

const outputSchema = z.object({});

const executeFunction = wrapTraced(
  async (): Promise<z.infer<typeof outputSchema>> => {
    // No-op: persistence and rendering handled by chunk processor
    return {};
  },
  { name: 'update-investigation-plan' }
);

export const updateInvestigationPlan = createTool({
  id: 'update-investigation-plan',
  description:
    'Create or update the investigation plan. Use after the first sequentialThinking call and whenever new hypotheses, questions, or data to investigate are identified. Provide a full markdown plan or structured arrays; plan is displayed in the reasoning UI.',
  inputSchema,
  outputSchema,
  execute: executeFunction,
});
