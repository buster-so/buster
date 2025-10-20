import { getDataSourceCredentials, getOrganizationDataSource } from '@buster/database/queries';
import { z } from 'zod';
import { createSandboxFromSnapshot } from '../management/create-sandbox';
import documentationAgentPrompt from './documentation-agent-prompt.txt';
import type { Sandbox } from '@daytonaio/sdk';
import { buildProfilesYaml, type Creds } from '../helpers/build-dbt-profiles-yaml';

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

export type RunDocsAgentParams = z.infer<typeof runDocsAgentParamsSchema>;
export type githubContext = z.infer<typeof githubContextSchema>;

export async function runDocsAgentAsync(params: RunDocsAgentParams) {
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

  const dataSourceResult = await getOrganizationDataSource({ organizationId: organizationId });
  const dataSourceCreds = await getDataSourceCredentials({
    dataSourceId: dataSourceResult.dataSourceId,
  }) as Creds;

  const sandboxSnapshotFullName = `${sandboxSnapshotBaseName}-${dataSourceResult.dataSourceSyntax}`;
  const sandbox = await createSandboxFromSnapshot(sandboxSnapshotFullName);

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

  // Create context directory and file
  await sandbox.fs.createFolder(contextPath, '755');
  await sandbox.fs.uploadFile(
    Buffer.from(JSON.stringify(context)),
    `${contextPath}/${contextFileName}`
  );

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    repositoryPath, // path
    branch, // branch "staging"
    undefined, // commit id
    env.GH_APP_ID, // username
    installationToken // password
  );

  const profileName = await getProfileName(sandbox, repositoryPath);

  const profileYaml = buildProfilesYaml({
    profileName,
    target: 'buster',
    creds: dataSourceCreds,
  });

  console.info('[Profile YAML]:', profileYaml);
  
  // Create profiles directory and file
  await sandbox.fs.createFolder(profilesPath, '755');
  await sandbox.fs.uploadFile(
    Buffer.from(profileYaml),
    `${profilesPath}/${profilesFileName}`
  );

  const envExportCommands = [
    `export DBT_PROFILES_DIR=${profilesPath}`,
    `export GITHUB_TOKEN=${installationToken}`,
    `export BUSTER_API_KEY=${apiKey}`,
    `export BUSTER_HOST=${env.BUSTER_HOST}`,
  ];

  await sandbox.process.createSession(sessionName);

  // Set environment variables
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `${envExportCommands.join(' && ')}`,
  });

  // // Install Buster CLI
  // await sandbox.process.executeSessionCommand(sessionName, {
  //   command: `curl -fsSL https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.sh | bash`,
  // });
  // await sandbox.process.executeSessionCommand(sessionName, {
  //   command: `buster --version`,
  // });

  // Setup Git
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
  });

  // Build CLI command with optional parameters
  const cliArgs = [];
  if (prompt) {
    cliArgs.push(`--prompt "${prompt}"`);
  } else {
    cliArgs.push(`--prompt "${documentationAgentPrompt}"`);
  }
  if (chatId) {
    cliArgs.push(`--chatId "${chatId}"`);
  }
  if (messageId) {
    cliArgs.push(`--messageId "${messageId}"`);
  }
  if (context) {
    cliArgs.push(`--contextFilePath "${contextPath}/${contextFileName}"`);
  }

  // // Execute Buster CLI command in async mode
  // await sandbox.process.executeSessionCommand(sessionName, {
  //   command: `cd ${repositoryPath} && buster ${cliArgs.join(' ')}`,
  //   runAsync: true,
  // });

  // // Use for debugging logs if needed
  // const logs = await sandbox.process.getSessionCommandLogs(
  //   sessionName,
  //   command.cmdId ?? '',
  //   (chunk) => console.info('[STDOUT]:', chunk),
  //   (chunk) => console.error('[STDERR]:', chunk)
  // );
  // console.info('[SANDBOXLOGS]:', logs);

  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
}

export async function runDocsAgentSync(params: RunDocsAgentParams) {
  // Validate input parameters
  const { installationToken, repoUrl, branch, prompt, apiKey, chatId, messageId, context } =
    runDocsAgentParamsSchema.parse(params);

  // Eventually we will need to find the organization's correct integration and call that snapshot
  const sandbox = await createSandboxFromSnapshot('buster-data-engineer-postgres');
  const workspacePath = `/workspace`;
  const repositoryPath = `${workspacePath}/repository`;
  const contextPath = `${workspacePath}/context`;
  const contextFileName = 'context.json';
  const busterAppGitUsername = 'buster-app';
  const busterAppGitEmail = 'buster-app@buster.so';
  const sessionName = 'buster-docs-agent-session';

  // Validate environment
  const env = envSchema.parse(process.env);

  // Create context directory and file
  await sandbox.fs.createFolder(contextPath, '755');
  await sandbox.fs.uploadFile(
    Buffer.from(JSON.stringify(context)),
    `${contextPath}/${contextFileName}`
  );

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    repositoryPath, // path
    branch, // branch "staging"
    undefined, // commit id
    env.GH_APP_ID, // username
    installationToken // password
  );
  // Install Buster CLI

  await sandbox.process.executeCommand(
    `curl -fsSL https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.sh | bash`,
    repositoryPath
  );
  await sandbox.process.executeCommand(`buster --version`, repositoryPath);

  await sandbox.process.executeCommand(
    `gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
    repositoryPath,
    {
      GITHUB_TOKEN: installationToken,
    }
  );

  // Build CLI command with optional parameters
  const cliArgs = [`--prompt "${prompt}"`];
  if (chatId) {
    cliArgs.push(`--chatId "${chatId}"`);
  }
  if (messageId) {
    cliArgs.push(`--messageId "${messageId}"`);
  }
  if (context) {
    cliArgs.push(`--contextFilePath "${contextPath}/${contextFileName}"`);
  }

  const command = await sandbox.process.executeCommand(
    `buster ${cliArgs.join(' ')}`,
    repositoryPath,
    {
      GITHUB_TOKEN: installationToken,
      BUSTER_API_KEY: apiKey,
      BUSTER_HOST: env.BUSTER_HOST,
    }
  );

  console.info(command);

  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
}

async function getProfileName(sandbox: Sandbox, filePath: string): Promise<string> {
  const profilesFileName = 'dbt_project.yml';
  let profileName = 'default';

  const matches = await sandbox.fs.findFiles(filePath, 'profile:');
  for (const match of matches) {
    if (match.file.includes(profilesFileName)) {
      const name = match.content.replace('profile:', '').trim();
      console.info('[Profile Name]:', name);
      if (name) {
        profileName = name;
        break;
      }
    }
  }

  return profileName;
}