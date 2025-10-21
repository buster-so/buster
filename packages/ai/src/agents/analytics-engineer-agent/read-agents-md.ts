import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Reads the AGENTS.md file from the current working directory if it exists.
 * This file provides additional context and instructions for the agent.
 *
 * @returns The contents of AGENTS.md or null if the file doesn't exist
 */
export async function readAgentsMd(): Promise<string | null> {
  try {
    const agentsMdPath = join(process.cwd(), 'AGENTS.md');
    const contents = await readFile(agentsMdPath, 'utf-8');
    return contents;
  } catch (error) {
    // File doesn't exist or can't be read - this is not an error condition
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    // Re-throw unexpected errors
    throw error;
  }
}
