import { Daytona } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for sandbox options
const CreateSandboxWithRepositoriesSchema = z.object({
  language: z.string().default('typescript').optional(),
  repository: z.string(),
  githubToken: z.string(),
  branchName: z.string(),
});

export type CreateSandboxWithRepositoriesOptions = z.infer<
  typeof CreateSandboxWithRepositoriesSchema
>;

export async function createSandboxWithRepositories(options: CreateSandboxWithRepositoriesOptions) {
  // Initialize the Daytona client
  const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY, target: 'us' });

  // Create the Sandbox instance
  const sandbox = await daytona.create({
    image: 'daytonaio/sandbox:0.4.3	',
    language: options.language || 'typescript',
    resources: {
      cpu: 5,
      memory: 10,
      disk: 20,
    },
    envVars: {
      GITHUB_TOKEN: options.githubToken,
    },
  });

  // Clone single repository if provided
  if (options.repository) {
    const repoUrl = options.repository;
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repository';
    const repoPath = `/home/daytona/${repoName}`;

    try {
      // Build git clone command with authentication if needed
      let cloneCommand = '';

      if (options.githubToken && repoUrl.includes('github.com')) {
        const authenticatedUrl = repoUrl.replace(
          'https://github.com/',
          `https://${options.githubToken}@github.com/`
        );
        cloneCommand = `git clone ${authenticatedUrl} ${repoPath}`;
      } else {
        cloneCommand = `git clone ${repoUrl} ${repoPath}`;
      }

      const cloneResult = await sandbox.process.executeCommand(cloneCommand, '/home/daytona/');

      if (cloneResult.exitCode !== 0) {
        throw new Error(
          `Git clone failed with exit code ${cloneResult.exitCode}: ${cloneResult.result}`
        );
      }

      console.info(`Repository ${repoName} cloned successfully`);

      await sandbox.process.executeCommand(
        `git config user.email "sandbox@example.com" && git config user.name "Sandbox User"`,
        repoPath
      );

      // Strategy: Always try to create and push first, handle failures gracefully
      console.info(`Setting up branch ${options.branchName} for ${repoName}...`);

      // Step 1: Create branch locally
      const createBranchCmd = `git checkout -b ${options.branchName}`;
      const createResult = await sandbox.process.executeCommand(createBranchCmd, repoPath);

      if (createResult.exitCode !== 0) {
        // Branch already exists locally, just check it out
        console.info(`Branch ${options.branchName} already exists locally, checking it out...`);
        const checkoutCmd = `git checkout ${options.branchName}`;
        const checkoutResult = await sandbox.process.executeCommand(checkoutCmd, repoPath);

        if (checkoutResult.exitCode !== 0) {
          throw new Error(
            `Failed to checkout branch ${options.branchName}: ${checkoutResult.result}`
          );
        }
      }

      // Step 2: Try to push the branch (this will fail if it already exists remotely)
      const pushCmd = `git push -u origin ${options.branchName}`;
      const pushResult = await sandbox.process.executeCommand(pushCmd, repoPath);

      if (pushResult.exitCode === 0) {
        // Successfully created and pushed the branch
        console.info(
          `Successfully created and pushed branch ${options.branchName} for ${repoName}`
        );
      } else if (
        pushResult.result?.includes('reference already exists') ||
        pushResult.result?.includes('already exists') ||
        pushResult.result?.includes('cannot lock ref')
      ) {
        // Branch already exists on remote (created by another sandbox)
        console.info(`Branch ${options.branchName} already exists on remote, syncing with it...`);

        // Fetch the remote branch
        await sandbox.process.executeCommand('git fetch origin', repoPath);

        // Delete the local branch and recreate it from remote
        await sandbox.process.executeCommand(`git checkout main || git checkout master`, repoPath);
        await sandbox.process.executeCommand(`git branch -D ${options.branchName}`, repoPath);

        // Check out the remote branch
        const checkoutRemoteCmd = `git checkout -b ${options.branchName} origin/${options.branchName}`;
        const checkoutRemoteResult = await sandbox.process.executeCommand(
          checkoutRemoteCmd,
          repoPath
        );

        if (checkoutRemoteResult.exitCode !== 0) {
          // If that fails, try alternative approaches
          console.info(`Trying alternative checkout approach...`);

          // Try fetching the specific branch
          const fetchBranchCmd = `git fetch origin ${options.branchName}:${options.branchName}`;
          await sandbox.process.executeCommand(fetchBranchCmd, repoPath);

          // Now checkout
          const checkoutCmd = `git checkout ${options.branchName}`;
          const checkoutResult = await sandbox.process.executeCommand(checkoutCmd, repoPath);

          if (checkoutResult.exitCode !== 0) {
            throw new Error(
              `Failed to checkout remote branch ${options.branchName}: ${checkoutResult.result}`
            );
          }
        }

        // Set upstream
        const setUpstreamCmd = `git branch --set-upstream-to=origin/${options.branchName} ${options.branchName}`;
        await sandbox.process.executeCommand(setUpstreamCmd, repoPath);

        console.info(
          `Successfully synced with remote branch ${options.branchName} for ${repoName}`
        );
      } else {
        // Some other push error
        throw new Error(
          `Failed to push branch ${options.branchName} to origin: ${pushResult.result}`
        );
      }

      console.info(`Repository is now on branch: ${options.branchName}`);
    } catch (error) {
      console.error(`Failed to process repository ${repoName}:`, error);
      throw error;
    }
  }

  return sandbox;
}
