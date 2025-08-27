import { Daytona } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for sandbox options
const CreateSandboxWithRepositoriesSchema = z.object({
  language: z.string().default('typescript').optional(),
  repositories: z.array(z.string()).optional(),
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

  // Clone repositories concurrently if provided
  if (options.repositories && options.repositories.length > 0) {
    console.info(`Cloning ${options.repositories.length} repositories concurrently...`);

    // Process each repository: clone and set up branch
    const repoPromises = options.repositories.map(async (repoUrl, index) => {
      // Extract repository name from URL for folder naming
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || `repo-${index}`;
      const repoPath = `/home/daytona/${repoName}`;

      try {
        // Build git clone command with authentication if needed
        let cloneCommand = '';

        // If GitHub token is provided and it's a GitHub URL, use token authentication
        if (options.githubToken && repoUrl.includes('github.com')) {
          // Insert token into the URL for authentication
          const authenticatedUrl = repoUrl.replace(
            'https://github.com/',
            `https://${options.githubToken}@github.com/`
          );
          cloneCommand = `git clone ${authenticatedUrl} ${repoPath}`;
        } else {
          cloneCommand = `git clone ${repoUrl} ${repoPath}`;
        }

        // Clone the repository
        const cloneResult = await sandbox.process.executeCommand(cloneCommand, '/home/daytona/');

        // Check if the clone command failed
        if (cloneResult.exitCode !== 0) {
          const error = new Error(
            `Git clone failed with exit code ${cloneResult.exitCode}: ${cloneResult.result}`
          );
          console.error(`Failed to clone repository ${repoName}:`, error.message);
          return { success: false, index, repoName, error };
        }

        console.info(`Repository ${repoName} cloned successfully`);

        // Configure git user for the repository (required for commits/pushes)
        await sandbox.process.executeCommand(
          `git config user.email "sandbox@example.com" && git config user.name "Sandbox User"`,
          repoPath
        );

        // Check if the branch already exists remotely
        const checkRemoteBranchCmd = `git ls-remote --heads origin ${options.branchName}`;
        const checkRemoteResult = await sandbox.process.executeCommand(checkRemoteBranchCmd, repoPath);
        
        const remoteBranchExists = checkRemoteResult.result && checkRemoteResult.result.trim().length > 0;

        if (remoteBranchExists) {
          // Branch exists remotely, fetch and checkout
          console.info(`Branch ${options.branchName} exists remotely for ${repoName}, fetching and checking out...`);
          
          // Fetch the specific branch
          const fetchCmd = `git fetch origin ${options.branchName}:${options.branchName}`;
          await sandbox.process.executeCommand(fetchCmd, repoPath);
          
          // Checkout the existing branch
          const checkoutCmd = `git checkout ${options.branchName}`;
          const checkoutResult = await sandbox.process.executeCommand(checkoutCmd, repoPath);
          
          if (checkoutResult.exitCode !== 0) {
            throw new Error(`Failed to checkout branch ${options.branchName}: ${checkoutResult.result}`);
          }
          
          console.info(`Switched to existing branch ${options.branchName} for ${repoName}`);
        } else {
          // Branch doesn't exist remotely, create it locally and push
          console.info(`Creating new branch ${options.branchName} for ${repoName}...`);
          
          // Create and checkout the new branch
          const createBranchCmd = `git checkout -b ${options.branchName}`;
          const createResult = await sandbox.process.executeCommand(createBranchCmd, repoPath);
          
          if (createResult.exitCode !== 0) {
            throw new Error(`Failed to create branch ${options.branchName}: ${createResult.result}`);
          }
          
          // Push the new branch to origin with upstream tracking
          const pushCmd = `git push -u origin ${options.branchName}`;
          const pushResult = await sandbox.process.executeCommand(pushCmd, repoPath);
          
          if (pushResult.exitCode !== 0) {
            throw new Error(`Failed to push branch ${options.branchName} to origin: ${pushResult.result}`);
          }
          
          console.info(`Created and pushed new branch ${options.branchName} for ${repoName}`);
        }

        return { success: true, index, repoName };
      } catch (error) {
        console.error(`Failed to process repository ${repoName}:`, error);
        return { success: false, index, repoName, error };
      }
    });

    // Wait for all repository operations to complete
    const results = await Promise.all(repoPromises);

    // Check if any operations failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.warn(`${failures.length} repositories failed to process`);
      failures.forEach((f) => {
        console.error(`  - ${f.repoName}: ${f.error}`);
      });
    }

    const successCount = results.filter((r) => r.success).length;
    console.info(
      `Successfully processed ${successCount} out of ${options.repositories.length} repositories`
    );
    
    if (successCount > 0) {
      console.info(`All repositories are now on branch: ${options.branchName}`);
    }
  }

  return sandbox;
}
