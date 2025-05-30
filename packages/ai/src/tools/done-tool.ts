import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface DoneParams {
  message?: string;
  summary?: string;
  final_artifacts?: Artifact[];
}

interface Artifact {
  type: 'dashboard' | 'metric' | 'report' | 'analysis';
  id: string;
  title: string;
  description?: string;
}

interface DoneResult {
  success: boolean;
  message: string;
  session_ended: boolean;
  artifacts_created: number;
  session_duration: number;
}

// Simple in-memory session storage for demo purposes
// In production, this would be backed by a persistent store
class SessionManager {
  private static sessions = new Map<string, { startTime: number; data: Map<string, unknown> }>();
  private static currentSessionId = 'default';

  static getSessionStartTime(): number {
    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      const startTime = Date.now();
      this.sessions.set(this.currentSessionId, { startTime, data: new Map() });
      return startTime;
    }
    return session.startTime;
  }

  static setState(key: string, value: unknown): void {
    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      const startTime = Date.now();
      const data = new Map();
      data.set(key, value);
      this.sessions.set(this.currentSessionId, { startTime, data });
    } else {
      session.data.set(key, value);
    }
  }

  static getState(key: string): unknown {
    const session = this.sessions.get(this.currentSessionId);
    return session?.data.get(key);
  }

  static endSession(): void {
    this.setState('session_active', false);
    this.setState('session_ended_at', new Date().toISOString());
  }

  static cleanupSession(): void {
    // In a real implementation, this would clean up resources
    // For now, just mark as cleaned up
    this.setState('session_cleaned', true);
  }
}

export const doneTool = createTool({
  id: 'done',
  description: 'Signal completion of all requested tasks and end the workflow',
  inputSchema: z.object({
    message: z
      .string()
      .optional()
      .describe('Optional completion message to display to the user'),
    summary: z.string().optional().describe('Optional summary of completed work'),
    final_artifacts: z
      .array(
        z.object({
          type: z.enum(['dashboard', 'metric', 'report', 'analysis']),
          id: z.string(),
          title: z.string(),
          description: z.string().optional(),
        })
      )
      .optional()
      .describe('List of artifacts created during the session'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    session_ended: z.boolean(),
    artifacts_created: z.number(),
    session_duration: z.number().describe('Session duration in milliseconds'),
  }),
  execute: async ({ context }) => {
    return await signalCompletion(context as DoneParams);
  },
});

const signalCompletion = wrapTraced(
  async (params: DoneParams): Promise<DoneResult> => {
    const startTime = SessionManager.getSessionStartTime();
    const currentTime = Date.now();
    const sessionDuration = currentTime - startTime;

    // Get final artifacts count
    const artifactsCreated = params.final_artifacts?.length || 0;

    // Prepare completion message
    const defaultMessage =
      artifactsCreated > 0
        ? `Task completed successfully. Created ${artifactsCreated} artifacts.`
        : 'Task completed successfully.';

    const finalMessage = params.message || defaultMessage;

    // Add summary if provided
    let completeMessage = finalMessage;
    if (params.summary) {
      completeMessage += `\n\nSummary: ${params.summary}`;
    }

    // List artifacts if any were created
    if (params.final_artifacts && params.final_artifacts.length > 0) {
      completeMessage += '\n\nCreated artifacts:';
      for (const artifact of params.final_artifacts) {
        completeMessage += `\n- ${artifact.type}: ${artifact.title}`;
        if (artifact.description) {
          completeMessage += ` - ${artifact.description}`;
        }
      }
    }

    // Update session state to indicate completion
    SessionManager.setState('workflow_completed', true);
    SessionManager.setState('completion_time', new Date().toISOString());
    SessionManager.setState('session_duration', sessionDuration);
    SessionManager.setState('final_message', completeMessage);

    // Mark session as ended
    SessionManager.endSession();

    return {
      success: true,
      message: completeMessage,
      session_ended: true,
      artifacts_created: artifactsCreated,
      session_duration: sessionDuration,
    };
  },
  { name: 'done' }
);

// Enhanced tool with auto-summary generation
export const doneToolWithSummary = createTool({
  id: 'done-with-summary',
  description: 'Signal completion with automatic session summary generation',
  inputSchema: z.object({
    message: z.string().optional(),
    include_auto_summary: z.boolean().default(true),
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
    const { message, include_auto_summary = true } = context as {
      message?: string;
      include_auto_summary?: boolean;
    };

    let autoSummary: string | undefined;
    if (include_auto_summary) {
      autoSummary = await generateSessionSummary();
    }

    const result = await signalCompletion({
      message,
      summary: autoSummary,
    });

    return {
      ...result,
      auto_summary: autoSummary,
    };
  },
});

async function generateSessionSummary(): Promise<string> {
  const createdMetrics = (SessionManager.getState('created_metrics') as unknown[]) || [];
  const createdDashboards = (SessionManager.getState('created_dashboards') as unknown[]) || [];
  const executedQueries = (SessionManager.getState('executed_queries') as unknown[]) || [];

  let summary = 'Session Summary:\n';

  if (createdMetrics.length > 0) {
    summary += `- Created ${createdMetrics.length} metrics\n`;
  }

  if (createdDashboards.length > 0) {
    summary += `- Created ${createdDashboards.length} dashboards\n`;
  }

  if (executedQueries.length > 0) {
    summary += `- Executed ${executedQueries.length} data queries\n`;
  }

  const totalArtifacts = createdMetrics.length + createdDashboards.length;
  if (totalArtifacts === 0) {
    summary += '- No artifacts were created (analysis or information request)\n';
  }

  return summary;
}