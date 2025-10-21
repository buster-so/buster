import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Reads the git-communication-rules.txt file from the agent directory.
 * This file provides critical Git workflow and communication guidelines for the agent.
 *
 * @returns The contents of git-communication-rules.txt or null if the file doesn't exist
 */
export async function readGitCommunicationRules(): Promise<string | null> {
  try {
    const gitRulesPath = join(__dirname, 'git-communication-rules.txt');
    const contents = await readFile(gitRulesPath, 'utf-8');
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
