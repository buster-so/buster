import type { Credentials } from '@buster/data-source';
import { getDataSourceCredentials, getOrganizationDataSource } from '@buster/database/queries';
import type { Sandbox } from '@daytonaio/sdk';
import { z } from 'zod';
import { buildProfilesYaml } from '../helpers/build-dbt-profiles-yaml';
import {
  createSandboxFromSnapshot,
  createSandboxWithBusterCLI,
} from '../management/create-sandbox';
import documentationAgentPrompt from './documentation-agent-prompt.txt';

// Define schema for environment validation
const envSchema = z.object({
  BUSTER_HOST: z.string().min(1, 'BUSTER_HOST environment variable is required'),
  GH_APP_ID: z.string().min(1).describe('GitHub App ID for authentication'),
});

// Define schema for GitHub context
const githubContextSchema = z
  .object({
    action: z.string().optional().describe('GitHub action type (e.g., opened, synchronize, push)'),
    after: z.string().optional().describe('Commit SHA after the event'),
    before: z.string().optional().describe('Commit SHA before the event'),
    prNumber: z.string().optional().describe('Pull request number'),
    repo: z.string().optional().describe('Repository name'),
    repo_url: z.string().optional().describe('Repository URL'),
    head_branch: z.string().optional().describe('Head branch name'),
    base_branch: z.string().optional().describe('Base branch name'),
    commits: z.array(z.string()).optional().describe('Array of commit IDs for push events'),
    dbtProjectFilePath: z.string().optional().describe('Path to the dbt project file'),
  })
  .optional();

// Define schema for runDocsAgent parameters
const runDocsAgentParamsSchema = z.object({
  installationToken: z.string().describe('GitHub installation token for authentication'),
  repoUrl: z.string().url().describe('Repository URL to clone'),
  branch: z.string().describe('Git branch to checkout'),
  prompt: z.string().optional().describe('Prompt to pass to the buster CLI'),
  apiKey: z.string().describe('Buster API key for authentication'),
  chatId: z.string().optional().describe('Chat ID for the buster CLI'),
  messageId: z.string().optional().describe('Message ID for the buster CLI'),
  context: githubContextSchema.optional().describe('GitHub context with optional properties'),
  organizationId: z.string().uuid().describe('Organization ID for the data source'),
});

export interface DocsAgentResult {
  commandId: string;
  sessionId: string;
  sandboxId: string;
}

export type RunDocsAgentParams = z.infer<typeof runDocsAgentParamsSchema>;
export type GithubContext = z.infer<typeof githubContextSchema>;

export async function runDocsAgentAsync(params: RunDocsAgentParams): Promise<DocsAgentResult> {
  // Validate input parameters
  const {
    installationToken,
    repoUrl,
    branch,
    prompt,
    apiKey,
    chatId,
    messageId,
    context,
    organizationId,
  } = runDocsAgentParamsSchema.parse(params);

  const sandboxSnapshotBaseName = 'buster-data-engineer';
  const sandboxContext = context || {};

  const dataSourceResult = await getOrganizationDataSource({ organizationId: organizationId });
  const rawDataSourceCredentials = await getDataSourceCredentials({
    dataSourceId: dataSourceResult.dataSourceId,
  });

  const credentials = {
    ...rawDataSourceCredentials,
    type: dataSourceResult.dataSourceSyntax,
  } as Credentials;

  const sandboxSnapshotFullName = `${sandboxSnapshotBaseName}-${dataSourceResult.dataSourceSyntax}`;
  const sandbox = await createSandboxWithBusterCLI(
    sandboxSnapshotFullName,
    `${sandboxSnapshotBaseName}-fallback`
  );

  const workspacePath = `/workspace`;
  const repositoryPath = `${workspacePath}/repository`;
  const contextPath = `${workspacePath}/context`;
  const profilesPath = `${workspacePath}/profiles`;
  const profilesFileName = 'profiles.yml';
  const contextFileName = 'context.json';
  const busterAppGitUsername = 'buster-app';
  const busterAppGitEmail = 'buster-app@buster.so';
  const sessionName = 'buster-docs-agent-session';

  // Validate environment
  const env = envSchema.parse(process.env);

  const envExportCommands = [
    `export GITHUB_TOKEN=${installationToken}`,
    `export BUSTER_API_KEY=${apiKey}`,
    `export BUSTER_HOST=${env.BUSTER_HOST}`,
    'export PATH="$HOME/.local/bin:$PATH"',
  ];

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    repositoryPath, // path
    branch, // branch "staging"
    undefined, // commit id
    env.GH_APP_ID, // username
    installationToken // password
  );

  const { profileName, projectFilePath } = await getDbtProjectInfo(sandbox, repositoryPath);

  // Only build and write profiles YAML if projectFilePath exists
  if (projectFilePath) {
    try {
      const profileYaml = buildProfilesYaml({
        profileName,
        target: 'buster',
        creds: credentials,
      });

      // Create profiles directory and file
      await sandbox.fs.createFolder(profilesPath, '755');
      await sandbox.fs.uploadFile(Buffer.from(profileYaml), `${profilesPath}/${profilesFileName}`);

      // Add context and env variable for dbt project and profiles
      sandboxContext.dbtProjectFilePath = projectFilePath;
      envExportCommands.push(`export DBT_PROFILES_DIR=${profilesPath}`);
    } catch (error) {
      console.error('Failed to build or write profiles YAML, continuing without profiles:', error);
      // Continue with the execution without dbt profiles
    }
  }

  await sandbox.process.createSession(sessionName);

  // Set environment variables
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `${envExportCommands.join(' && ')}`,
  });

  // Setup Git
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
  });

  // Write prompt to file to avoid shell interpretation issues with backticks and substitution
  const promptContent = prompt || documentationAgentPrompt;
  const promptFilePath = `${workspacePath}/prompt.md`;
  await sandbox.fs.uploadFile(Buffer.from(promptContent), promptFilePath);

  // Build CLI command with optional parameters
  const cliArgs = [];
  cliArgs.push(`--prompt "$(cat ${promptFilePath})"`);

  if (chatId) {
    cliArgs.push(`--chatId "${chatId}"`);
  }
  if (messageId) {
    cliArgs.push(`--messageId "${messageId}"`);
  }
  if (Object.keys(sandboxContext).length > 0) {
    // Create context directory and file
    await sandbox.fs.createFolder(contextPath, '755');
    await sandbox.fs.uploadFile(
      Buffer.from(JSON.stringify(sandboxContext)),
      `${contextPath}/${contextFileName}`
    );

    cliArgs.push(`--contextFilePath "${contextPath}/${contextFileName}"`);
  }

  // Execute Buster CLI command in async mode
  const busterCommand = await sandbox.process.executeSessionCommand(sessionName, {
    command: `cd ${repositoryPath} && buster ${cliArgs.join(' ')}`,
    runAsync: true,
  });

  if (!busterCommand.cmdId) {
    throw new Error('Failed to execute Buster CLI command');
  }

  // // Use for debugging logs if needed
  // const logs = await sandbox.process.getSessionCommandLogs(
  //   sessionName,
  //   busterCommand.cmdId ?? '',
  //   (chunk) => console.info(`[STDOUT]: ${chunk}`),
  //   (chunk) => console.error(`[STDERR]: ${chunk}`)
  // );
  // console.info(`[SANDBOXLOGS]: ${logs}`);

  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
  return {
    commandId: busterCommand.cmdId,
    sessionId: sessionName,
    sandboxId: sandbox.id,
  };
}

export async function runDocsAgentSync(params: RunDocsAgentParams) {
  // Validate input parameters
  const {
    installationToken,
    repoUrl,
    branch,
    prompt,
    apiKey,
    chatId,
    messageId,
    context,
    organizationId,
  } = runDocsAgentParamsSchema.parse(params);

  const sandboxSnapshotBaseName = 'buster-data-engineer';
  const sandboxContext = context || {};

  const dataSourceResult = await getOrganizationDataSource({ organizationId: organizationId });
  const rawDataSourceCredentials = await getDataSourceCredentials({
    dataSourceId: dataSourceResult.dataSourceId,
  });

  const credentials = {
    ...rawDataSourceCredentials,
    type: dataSourceResult.dataSourceSyntax,
  } as Credentials;

  const sandboxSnapshotFullName = `${sandboxSnapshotBaseName}-${dataSourceResult.dataSourceSyntax}`;
  const sandbox = await createSandboxWithBusterCLI(
    sandboxSnapshotFullName,
    `${sandboxSnapshotBaseName}-fallback`
  );

  const workspacePath = `/workspace`;
  const repositoryPath = `${workspacePath}/repository`;
  const contextPath = `${workspacePath}/context`;
  const profilesPath = `${workspacePath}/profiles`;
  const profilesFileName = 'profiles.yml';
  const contextFileName = 'context.json';
  const busterAppGitUsername = 'buster-app';
  const busterAppGitEmail = 'buster-app@buster.so';
  const sessionName = 'buster-docs-agent-session';

  // Validate environment
  const env = envSchema.parse(process.env);

  const envVars: Record<string, string> = {
    GITHUB_TOKEN: installationToken,
    BUSTER_API_KEY: apiKey,
    BUSTER_HOST: env.BUSTER_HOST,
  };

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    repositoryPath, // path
    branch, // branch "staging"
    undefined, // commit id
    env.GH_APP_ID, // username
    installationToken // password
  );

  const { profileName, projectFilePath } = await getDbtProjectInfo(sandbox, repositoryPath);

  // Only build and write profiles YAML if projectFilePath exists
  if (projectFilePath) {
    try {
      const profileYaml = buildProfilesYaml({
        profileName,
        target: 'buster',
        creds: credentials,
      });

      // Create profiles directory and file
      await sandbox.fs.createFolder(profilesPath, '755');
      await sandbox.fs.uploadFile(Buffer.from(profileYaml), `${profilesPath}/${profilesFileName}`);

      // Add context and env variable for dbt project and profiles
      sandboxContext.dbtProjectFilePath = projectFilePath;
      envVars.DBT_PROFILES_DIR = profilesPath;
    } catch (error) {
      console.error('Failed to build or write profiles YAML, continuing without profiles:', error);
      // Continue with the execution without dbt profiles
    }
  }

  // Setup Git
  await sandbox.process.executeCommand(
    `gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
    repositoryPath,
    envVars
  );

  // Write prompt to file to avoid shell interpretation issues with backticks and substitution
  const promptContent = prompt || documentationAgentPrompt;
  const promptFilePath = `${workspacePath}/prompt.md`;
  await sandbox.fs.uploadFile(Buffer.from(promptContent), promptFilePath);

  // Build CLI command with optional parameters
  const cliArgs = [];
  cliArgs.push(`--prompt "$(cat ${promptFilePath})"`);

  if (chatId) {
    cliArgs.push(`--chatId "${chatId}"`);
  }
  if (messageId) {
    cliArgs.push(`--messageId "${messageId}"`);
  }
  if (Object.keys(sandboxContext).length > 0) {
    // Create context directory and file
    await sandbox.fs.createFolder(contextPath, '755');
    await sandbox.fs.uploadFile(
      Buffer.from(JSON.stringify(sandboxContext)),
      `${contextPath}/${contextFileName}`
    );

    cliArgs.push(`--contextFilePath "${contextPath}/${contextFileName}"`);
  }

  // Execute Buster CLI command synchronously
  const command = `export PATH="$HOME/.local/bin:$PATH" && buster ${cliArgs.join(' ')}`;
  const commandExecution = await sandbox.process.executeCommand(command, repositoryPath, envVars);

  console.info(commandExecution);

  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
}

export async function getDbtProjectInfo(
  sandbox: Sandbox,
  filePath: string
): Promise<{ profileName: string; projectFilePath: string }> {
  const profilesFileName = 'dbt_project.yml';
  let profileName = 'default';
  let projectFilePath = '';

  const matches = await sandbox.fs.findFiles(filePath, 'profile:');
  for (const match of matches) {
    if (match.file.includes(profilesFileName)) {
      projectFilePath = match.file;
      const name = match.content
        .replace('profile:', '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
      if (name) {
        profileName = name;
        break;
      }
    }
  }

  return { profileName, projectFilePath };
}
