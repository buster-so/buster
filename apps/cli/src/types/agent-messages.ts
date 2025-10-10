/**
 * Agent message types - discriminated union for all possible message types
 * This is the single source of truth for message type definitions
 */

export type AgentMessage =
  | { kind: 'user'; content: string }
  | { kind: 'text-delta'; content: string }
  | { kind: 'idle'; args: { final_response?: string } }
  | {
      kind: 'bash';
      event: 'start' | 'complete';
      args: { command: string; description?: string };
      result?: { stdout?: string; stderr?: string; exitCode: number; success: boolean };
    }
  | {
      kind: 'grep';
      event: 'start' | 'complete';
      args: { pattern: string; glob?: string; command: string };
      result?: {
        matches: Array<{ path: string; lineNum: number; lineText: string }>;
        totalMatches: number;
        truncated: boolean;
      };
    }
  | {
      kind: 'ls';
      event: 'start' | 'complete';
      args: { path?: string; command: string };
      result?: {
        output: string;
        success: boolean;
        count: number;
        truncated: boolean;
        errorMessage?: string;
      };
    }
  | {
      kind: 'write';
      event: 'start' | 'complete';
      args: { files: Array<{ path: string; content: string }> };
      result?: {
        results: Array<{ status: 'success' | 'error'; filePath: string; errorMessage?: string }>;
      };
    }
  | {
      kind: 'edit';
      event: 'start' | 'complete';
      args: {
        filePath: string;
        oldString?: string;
        newString?: string;
        edits?: Array<{ oldString: string; newString: string }>;
      };
      result?: {
        success: boolean;
        filePath: string;
        diff?: string;
        finalDiff?: string;
        message?: string;
        errorMessage?: string;
      };
    }
  | {
      kind: 'read';
      event: 'start' | 'complete';
      args: { filePath: string };
      result?: {
        status: 'success' | 'error';
        file_path: string;
        content?: string;
        truncated?: boolean;
        error_message?: string;
      };
    }
  | {
      kind: 'task';
      event: 'start' | 'complete';
      args: { instructions: string };
      result?: {
        status: 'success' | 'error';
        summary?: string;
        // Nested messages are the same AgentMessage types (excluding user and text-delta which don't make sense in task context)
        messages?: Exclude<AgentMessage, { kind: 'user' } | { kind: 'text-delta' }>[];
        error_message?: string;
      };
    };
