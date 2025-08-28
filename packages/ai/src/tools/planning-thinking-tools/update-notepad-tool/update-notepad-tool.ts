import { tool } from 'ai';
import { z } from 'zod';
import { createUpdateNotepadToolExecute } from './update-notepad-tool-execute';

/**
 * Tool for managing a notepad where the agent can document its process,
 * findings, decisions, assumptions, and challenges during context gathering.
 *
 * The notepad serves as a working document for the agent to:
 * - Summarize findings during context gathering
 * - Document key decisions and rationale
 * - Note assumptions made during analysis
 * - Record challenges encountered
 * - Keep track of important observations
 * - Document the reasoning process
 *
 * Example notepad structure:
 *
 * # Documentation Agent Notes
 *
 * ## Context Gathering
 * - Found existing documentation in /docs folder using dbt structure
 * - Repository appears to be a data pipeline with multiple models
 * - Main entry point is models/staging/stg_customers.sql
 *
 * ## Key Decisions
 * - Decided to organize documentation by business domain rather than technical structure
 * - Using markdown format for consistency with existing docs
 * - Will create separate docs for each major data model
 *
 * ## Assumptions
 * - Assuming the staging models are the source of truth
 * - Documentation should be accessible to both technical and business users
 * - Existing naming conventions should be preserved
 *
 * ## Challenges & Observations
 * - Complex dependencies between models require careful documentation
 * - Some models lack clear business context
 * - Need to balance technical accuracy with readability
 *
 * ## Next Steps & Considerations
 * - Review all model dependencies before finalizing structure
 * - Consider adding data lineage diagrams
 * - May need to clarify business rules with stakeholders
 */

export const UPDATE_NOTEPAD_TOOL_NAME = 'updateNotepad';

const UpdateNotepadEditSchema = z.object({
  operation: z.enum(['replace', 'append']).describe(
    `You should perform an append when you just want to add new notes to the end of the notepad. 
      You should perform a replace when you want to replace existing content with new content.
      Appending is preferred over replacing because it preserves existing notes and is less likely to cause issues.
      If you are replacing content, you should provide the content you want to replace and the new content you want to insert.`
  ),
  content_to_replace: z
    .string()
    .describe(
      'The string content that should be replaced in the current notepad. This is required for the replace operation. Will just be an empty string for the append operation.'
    ),
  content: z
    .string()
    .describe(
      'The new markdown content to insert. Either replaces content_to_replace or appends to the end. This is required for both the replace and append operations.'
    ),
});

export const UpdateNotepadToolInputSchema = z.object({
  edits: z
    .array(UpdateNotepadEditSchema)
    .min(1)
    .describe('Array of edit operations to apply sequentially to the notepad'),
});

const UpdateNotepadToolOutputSchema = z.object({
  success: z.boolean(),
  updatedNotepad: z.string().describe('The updated notepad after all edits'),
  errors: z.array(z.string()).optional().describe('List of errors if any edit operations failed'),
});

const UpdateNotepadToolContextSchema = z.object({
  notepad: z.string().describe('The current notepad contents'),
});

export type UpdateNotepadEdit = z.infer<typeof UpdateNotepadEditSchema>;
export type UpdateNotepadToolInput = z.infer<typeof UpdateNotepadToolInputSchema>;
export type UpdateNotepadToolOutput = z.infer<typeof UpdateNotepadToolOutputSchema>;
export type UpdateNotepadToolContext = z.infer<typeof UpdateNotepadToolContextSchema>;

export function createUpdateNotepadTool(context: UpdateNotepadToolContext) {
  const execute = createUpdateNotepadToolExecute(context);

  return tool({
    description:
      'Update the notepad with notes about findings, decisions, assumptions, and challenges. Use this to document your process outside of todo items. Can either append new notes to the end or replace specific content within the notepad.',
    inputSchema: UpdateNotepadToolInputSchema,
    outputSchema: UpdateNotepadToolOutputSchema,
    execute,
  });
}

// Legacy export for backward compatibility
export const updateNotepad = createUpdateNotepadTool({
  notepad: '',
});
