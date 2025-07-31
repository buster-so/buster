import { Daytona } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for sandbox options
const createSandboxOptionsSchema = z.object({
  language: z.string().default('typescript').optional(),
});

export type CreateSandboxOptions = z.infer<typeof createSandboxOptionsSchema>;

// Define schema for environment validation
const envSchema = z.object({
  DAYTONA_API_KEY: z.string().min(1, 'DAYTONA_API_KEY environment variable is required'),
});

export async function createSandbox(options: CreateSandboxOptions = {}) {
  // Validate options
  const validatedOptions = createSandboxOptionsSchema.parse(options);

  // Validate environment
  const env = envSchema.parse(process.env);

  // Initialize the Daytona client
  const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY, target: 'us' });

  // Create the Sandbox instance
  const sandbox = await daytona.create({
    language: validatedOptions.language || 'typescript',
  });

  return sandbox;
}

const createSandboxWithGitSchema = z.object({
  language: z.string().default('typescript').optional(),
  gitUrl: z.string().url(),
  // GitHub Personal Access Token for private repositories
  githubToken: z.string().optional(),
  // Git user configuration
  gitUserName: z.string().optional(),
  gitUserEmail: z.string().optional(),
});

export type CreateSandboxWithGitOptions = z.infer<typeof createSandboxWithGitSchema>;

export async function createSandboxWithGit(options: CreateSandboxWithGitOptions) {
  const validatedOptions = createSandboxWithGitSchema.parse(options);

  const sandbox = await createSandbox(validatedOptions);

  // Clone the repository with token authentication if provided
  if (validatedOptions.githubToken) {
    // Construct authenticated git URL using token
    const urlWithAuth = validatedOptions.gitUrl.replace(
      'https://github.com/',
      `https://dallinbentley:${validatedOptions.githubToken}@github.com/`
    );

    // Execute git clone with authenticated URL
    try {
      const cloneCommand = `git clone ${urlWithAuth}`;
      console.log('Executing git clone command:', cloneCommand);

      const cloneResult = await sandbox.process.executeCommand(cloneCommand);
      console.log('Git clone result:', {
        exitCode: cloneResult.exitCode,
        output: cloneResult.result,
      });

      if (cloneResult.exitCode !== 0) {
        const error = new Error(`Git clone failed: ${cloneResult.result}`);
        console.log('Git clone command failed:', error.message);
        throw error;
      }
    } catch (error) {
      console.log('Error executing git clone command:', error);
      throw error;
    }
  } else {
    // Clone public repository without authentication
    try {
      const cloneCommand = `git clone ${validatedOptions.gitUrl}`;
      console.log('Executing git clone command:', cloneCommand);

      const cloneResult = await sandbox.process.executeCommand(cloneCommand);
      console.log('Git clone result:', {
        exitCode: cloneResult.exitCode,
        output: cloneResult.result,
      });

      if (cloneResult.exitCode !== 0) {
        const error = new Error(`Git clone failed: ${cloneResult.result}`);
        console.log('Git clone command failed:', error.message);
        throw error;
      }
    } catch (error) {
      console.log('Error executing git clone command:', error);
      throw error;
    }
  }

  // Configure git user settings if provided
  if (validatedOptions.gitUserName) {
    try {
      const nameResult = await sandbox.process.executeCommand(
        `git config --global user.name ${validatedOptions.gitUserName}`
      );
      if (nameResult.exitCode !== 0) {
        const error = new Error(`Git config user.name failed: ${nameResult.result}`);
        console.log('Git config user.name command failed:', error.message);
        throw error;
      }
    } catch (error) {
      console.log('Error executing git config user.name command:', error);
      throw error;
    }
  }

  if (validatedOptions.gitUserEmail) {
    try {
      const emailResult = await sandbox.process.executeCommand(
        `git config --global user.email ${validatedOptions.gitUserEmail}`
      );
      if (emailResult.exitCode !== 0) {
        const error = new Error(`Git config user.email failed: ${emailResult.result}`);
        console.log('Git config user.email command failed:', error.message);
        throw error;
      }
    } catch (error) {
      console.log('Error executing git config user.email command:', error);
      throw error;
    }
  }

  // Generate random branch name
  const randomBranchName = `docs-agent-${Math.floor(Math.random() * 1000000)}`;

  // Get the repository name from the URL to determine the directory
  const repoName = validatedOptions.gitUrl.split('/').pop()?.replace('.git', '') || '';

  // Create and checkout new branch
  try {
    const checkoutResult = await sandbox.process.executeCommand(
      `cd ${repoName} && git checkout -b ${randomBranchName}`
    );

    if (checkoutResult.exitCode !== 0) {
      const error = new Error(`Git checkout failed: ${checkoutResult.result}`);
      console.info('Git checkout command failed:', error.message);
      throw error;
    }

    console.info(`Successfully created and checked out branch: ${randomBranchName}`);
  } catch (error) {
    console.info('Error creating git branch:', error);
    throw error;
  }

  return sandbox;
}
