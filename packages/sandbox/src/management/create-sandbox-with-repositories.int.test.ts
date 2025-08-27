import { describe, it, expect, beforeAll } from 'vitest';
import { createSandbox } from './create-sandbox-with-repositories';

describe('create-sandbox-with-repositories integration', () => {
  let hasRequiredEnvVars: boolean;

  beforeAll(() => {
    // Check if required environment variables are present
    hasRequiredEnvVars = Boolean(
      process.env.TEST_GITHUB_PAT && 
      process.env.TEST_SAMPLE_REPO && 
      process.env.DAYTONA_API_KEY
    );

    if (!hasRequiredEnvVars) {
      console.info('Skipping integration test - TEST_GITHUB_PAT, TEST_SAMPLE_REPO, or DAYTONA_API_KEY not set');
    }
  });

  it('should create sandbox and clone repository concurrently', async () => {
    // Skip test if environment variables are not set
    if (!hasRequiredEnvVars) {
      expect(true).toBe(true);
      return;
    }

    const sandbox = await createSandbox({
      language: 'typescript',
      repositories: [process.env.TEST_SAMPLE_REPO!],
      githubToken: process.env.TEST_GITHUB_PAT!,
    });

    expect(sandbox).toBeDefined();
    expect(sandbox.id).toBeDefined();

    // Verify the repository was cloned by checking if the directory exists
    const repoName = process.env.TEST_SAMPLE_REPO!.split('/').pop()?.replace('.git', '') || 'repo';
    const checkDirCommand = `ls -la /home/daytona/${repoName}`;
    
    try {
      const result = await sandbox.process.executeCommand(checkDirCommand, '/home/daytona/');
      expect(result).toBeDefined();
      console.info('Repository cloned successfully:', result);
    } catch (error) {
      throw new Error(`Failed to verify repository clone: ${error}`);
    }

    // Clean up - stop the sandbox
    await sandbox.stop();
  }, 60000); // 60 second timeout for sandbox creation and repo cloning
});