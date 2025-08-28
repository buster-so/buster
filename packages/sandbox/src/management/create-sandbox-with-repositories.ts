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
    language: options.language || 'typescript',
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

      const checkRemoteBranchCmd = `git ls-remote --heads origin ${options.branchName}`;
      const checkRemoteResult = await sandbox.process.executeCommand(
        checkRemoteBranchCmd,
        repoPath
      );

      const remoteBranchExists =
        checkRemoteResult.result && checkRemoteResult.result.trim().length > 0;

      if (remoteBranchExists) {
        console.info(
          `Branch ${options.branchName} exists remotely for ${repoName}, fetching and checking out...`
        );

        const fetchCmd = `git fetch origin ${options.branchName}:${options.branchName}`;
        await sandbox.process.executeCommand(fetchCmd, repoPath);

        const checkoutCmd = `git checkout ${options.branchName}`;
        const checkoutResult = await sandbox.process.executeCommand(checkoutCmd, repoPath);

        if (checkoutResult.exitCode !== 0) {
          throw new Error(
            `Failed to checkout branch ${options.branchName}: ${checkoutResult.result}`
          );
        }

        console.info(`Switched to existing branch ${options.branchName} for ${repoName}`);
      } else {
        console.info(`Creating new branch ${options.branchName} for ${repoName}...`);

        const createBranchCmd = `git checkout -b ${options.branchName}`;
        const createResult = await sandbox.process.executeCommand(createBranchCmd, repoPath);

        if (createResult.exitCode !== 0) {
          throw new Error(`Failed to create branch ${options.branchName}: ${createResult.result}`);
        }

        const pushCmd = `git push -u origin ${options.branchName}`;
        const pushResult = await sandbox.process.executeCommand(pushCmd, repoPath);

        if (pushResult.exitCode !== 0) {
          throw new Error(
            `Failed to push branch ${options.branchName} to origin: ${pushResult.result}`
          );
        }

        console.info(`Created and pushed new branch ${options.branchName} for ${repoName}`);
      }

      console.info(`Repository is now on branch: ${options.branchName}`);
    } catch (error) {
      console.error(`Failed to process repository ${repoName}:`, error);
      throw error;
    }
  }

  return sandbox;
}
