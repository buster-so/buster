import { Daytona } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for sandbox options
const CreateSandboxWithRepositoriesSchema = z.object({
  language: z.string().default('typescript').optional(),
  repositories: z.array(z.string()).optional(),
  githubToken: z.string(),
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

    // Create clone commands for each repository
    const cloneCommands = options.repositories.map((repoUrl, index) => {
      // Extract repository name from URL for folder naming
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || `repo-${index}`;

      // Build git clone command with authentication if needed
      let cloneCommand = '';

      // If GitHub token is provided and it's a GitHub URL, use token authentication
      if (options.githubToken && repoUrl.includes('github.com')) {
        // Insert token into the URL for authentication
        const authenticatedUrl = repoUrl.replace(
          'https://github.com/',
          `https://${options.githubToken}@github.com/`
        );
        cloneCommand = `git clone ${authenticatedUrl} /home/daytona/${repoName}`;
      } else {
        cloneCommand = `git clone ${repoUrl} /home/daytona/${repoName}`;
      }

      return cloneCommand;
    });

    // Execute all clone commands concurrently
    const clonePromises = cloneCommands.map(async (command, index) => {
      try {
        const result = await sandbox.process.executeCommand(command, '/home/daytona/');

        // Check if the command failed based on exit code
        if (result.exitCode !== 0) {
          const error = new Error(
            `Git clone failed with exit code ${result.exitCode}: ${result.result}`
          );
          console.error(`Failed to clone repository ${index + 1}:`, error.message);
          return { success: false, index, error };
        }

        console.info(`Repository ${index + 1} cloned successfully`);
        return { success: true, index, result };
      } catch (error) {
        console.error(`Failed to clone repository ${index + 1}:`, error);
        return { success: false, index, error };
      }
    });

    // Wait for all clones to complete
    const results = await Promise.all(clonePromises);

    // Check if any clones failed
    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.warn(`${failures.length} repositories failed to clone`);
    }

    console.info(
      `Successfully cloned ${results.filter((r) => r.success).length} out of ${options.repositories.length} repositories`
    );
  }

  return sandbox;
}
