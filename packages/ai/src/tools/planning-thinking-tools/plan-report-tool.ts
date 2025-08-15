import { createTool } from '@mastra/core';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

const inputSchema = z
  .object({
    reportSections: z
      .array(z.string())
      .describe(
        'An outline of the different sections planned for the report. Each section should be a brief title or description of what will be covered.'
      )
      .optional(),
    keyIdeas: z
      .string()
      .describe(
        'Open text explanation of everything the agent discovered during investigation. This should be a comprehensive review of all findings, patterns, insights, and conclusions from the research phase.'
      )
      .optional(),
  })
  .refine((data) => Boolean(data.reportSections || data.keyIdeas), {
    message: 'At least one of reportSections or keyIdeas must be provided.',
  });

const outputSchema = z.object({});

const executeFunction = wrapTraced(
  async (): Promise<z.infer<typeof outputSchema>> => {
    // No-op: persistence and rendering handled by chunk processor
    return {};
  },
  { name: 'plan-report' }
);

export const planReport = createTool({
  id: 'plan-report',
  description:
    'Plan the structure and content of a report before submission. Use this tool when you are ready to build a report but before calling submitThoughtsForReview. This tool helps organize your findings into a coherent report structure with notes and outline.',
  inputSchema,
  outputSchema,
  execute: executeFunction,
});
