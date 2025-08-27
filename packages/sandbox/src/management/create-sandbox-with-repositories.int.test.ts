import { beforeAll, describe, expect, it } from 'vitest';
import { createSandboxWithRepositories } from './create-sandbox-with-repositories';

describe('create-sandbox-with-repositories integration', () => {
  let hasRequiredEnvVars: boolean;

  beforeAll(() => {
    // Check if required environment variables are present
    hasRequiredEnvVars = Boolean(
      process.env.TEST_GITHUB_PAT && process.env.TEST_SAMPLE_REPO && process.env.DAYTONA_API_KEY
    );

    if (!hasRequiredEnvVars) {
      console.info(
        'Skipping integration test - TEST_GITHUB_PAT, TEST_SAMPLE_REPO, or DAYTONA_API_KEY not set'
      );
    }
  });

  it('should create sandbox and clone repository concurrently', async () => {
    const sandbox = await createSandboxWithRepositories({
      language: 'typescript',
      repositories: [process.env.TEST_SAMPLE_REPO!],
      githubToken: process.env.TEST_GITHUB_PAT!,
    });

    // Clean up - stop the sandbox
    await sandbox.stop();
  }, 60000); // 60 second timeout for sandbox creation and repo cloning
});
