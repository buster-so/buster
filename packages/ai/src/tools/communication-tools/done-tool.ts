import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const MESSAGE_PARAM_DESCRIPTION = `
The final response message to the user. 

**MUST** be formatted in Markdown. Use bullet points or other appropriate Markdown formatting. Do not include headers. Do not use the '•' bullet character. 

Do not include markdown tables.
`;

// Artifact type definitions
const ArtifactSchema = z.object({
  type: z.enum(['dashboard', 'metric', 'report', 'analysis']),
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

type Artifact = z.infer<typeof ArtifactSchema>;

// Mock session manager - in a real implementation this would come from context
const getSessionStartTime = (): number => {
  // For now, assume session started 1 minute ago
  return Date.now() - 60000;
};

function generateCompletionMessage(
  message: string,
  summary?: string,
  artifacts?: Artifact[]
): string {
  let finalMessage = message;

  if (summary) {
    finalMessage += `\n\n${summary}`;
  }

  if (artifacts && artifacts.length > 0) {
    finalMessage += '\n\n**Created artifacts:**\n';
    for (const artifact of artifacts) {
      finalMessage += `- **${artifact.title}** (${artifact.type})`;
      if (artifact.description) {
        finalMessage += ` - ${artifact.description}`;
      }
      finalMessage += '\n';
    }
  }

  return finalMessage;
}

function generateAutoSummary(artifacts?: Artifact[]): string {
  let summary = '## Session Summary:\n\n';

  if (!artifacts || artifacts.length === 0) {
    summary += 'No artifacts were created during this session. ';
    summary += 'Provided information and guidance to complete the requested tasks.';
  } else {
    const dashboards = artifacts.filter((a) => a.type === 'dashboard');
    const metrics = artifacts.filter((a) => a.type === 'metric');
    const reports = artifacts.filter((a) => a.type === 'report');
    const analyses = artifacts.filter((a) => a.type === 'analysis');

    summary += `Created ${artifacts.length} total artifact${artifacts.length === 1 ? '' : 's'}:\n`;

    if (dashboards.length > 0) {
      summary += `- ${dashboards.length} dashboard${dashboards.length === 1 ? '' : 's'}\n`;
    }
    if (metrics.length > 0) {
      summary += `- ${metrics.length} metric${metrics.length === 1 ? '' : 's'}\n`;
    }
    if (reports.length > 0) {
      summary += `- ${reports.length} report${reports.length === 1 ? '' : 's'}\n`;
    }
    if (analyses.length > 0) {
      summary += `- ${analyses.length} analys${analyses.length === 1 ? 'is' : 'es'}\n`;
    }
  }

  return summary;
}

export const doneTool = createTool({
  id: 'done',
  description: 'Signal completion of all requested tasks and end the workflow',
  inputSchema: z.object({
    message: z.string().describe(MESSAGE_PARAM_DESCRIPTION),
    summary: z.string().optional().describe('Optional summary of what was accomplished'),
    final_artifacts: z
      .array(ArtifactSchema)
      .optional()
      .describe('List of artifacts created during the session'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    session_ended: z.boolean(),
    artifacts_created: z.number(),
    session_duration: z.number(),
  }),
  execute: async ({ context }) => {
    const { message, summary, final_artifacts } = context;
    const sessionStartTime = getSessionStartTime();
    const sessionDuration = Date.now() - sessionStartTime;
    const artifactsCount = final_artifacts?.length || 0;

    const finalMessage = message || 'Task completed successfully.';
    const completionMessage = generateCompletionMessage(finalMessage, summary, final_artifacts);

    return {
      success: true,
      message: completionMessage,
      session_ended: true,
      artifacts_created: artifactsCount,
      session_duration: sessionDuration,
    };
  },
});

export const doneToolWithSummary = createTool({
  id: 'done-with-summary',
  description: 'Signal completion with automatic session summary generation',
  inputSchema: z.object({
    message: z.string().describe(MESSAGE_PARAM_DESCRIPTION),
    include_auto_summary: z
      .boolean()
      .default(true)
      .describe('Whether to include automatic session summary'),
    final_artifacts: z
      .array(ArtifactSchema)
      .optional()
      .describe('List of artifacts created during the session'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    session_ended: z.boolean(),
    artifacts_created: z.number(),
    session_duration: z.number(),
    auto_summary: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { message, include_auto_summary = true, final_artifacts } = context;
    const sessionStartTime = getSessionStartTime();
    const sessionDuration = Date.now() - sessionStartTime;
    const artifactsCount = final_artifacts?.length || 0;

    let autoSummary: string | undefined;
    let finalMessage = message;

    if (include_auto_summary) {
      autoSummary = generateAutoSummary(final_artifacts);
      finalMessage = `${message}\n\n${autoSummary}`;
    }

    return {
      success: true,
      message: finalMessage,
      session_ended: true,
      artifacts_created: artifactsCount,
      session_duration: sessionDuration,
      auto_summary: autoSummary,
    };
  },
});
