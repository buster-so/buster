import { z } from 'zod';
import { createSandboxFromSnapshot } from '../management/create-sandbox';

// Define schema for environment validation
const envSchema = z.object({
  BUSTER_HOST: z.string().min(1, 'BUSTER_HOST environment variable is required'),
  GH_APP_ID: z.string().min(1).describe('GitHub App ID for authentication'),
});

// Define schema for GitHub context
const githubContextSchema = z.object({
  action: z.string().optional().describe('GitHub action type (e.g., opened, synchronize, push)'),
  after: z.string().optional().describe('Commit SHA after the event'),
  before: z.string().optional().describe('Commit SHA before the event'),
  prNumber: z.string().optional().describe('Pull request number'),
  repo: z.string().optional().describe('Repository name'),
  repo_url: z.string().optional().describe('Repository URL'),
  head_branch: z.string().optional().describe('Head branch name'),
  base_branch: z.string().optional().describe('Base branch name'),
  commits: z.array(z.string()).optional().describe('Array of commit IDs for push events'),
}).optional();

// Define schema for runDocsAgent parameters
const runDocsAgentParamsSchema = z.object({
  installationToken: z.string().describe('GitHub installation token for authentication'),
  repoUrl: z.string().url().describe('Repository URL to clone'),
  branch: z.string().describe('Git branch to checkout'),
  prompt: z.string().describe('Prompt to pass to the buster CLI'),
  apiKey: z.string().describe('Buster API key for authentication'),
  chatId: z.string().optional().describe('Chat ID for the buster CLI'),
  messageId: z.string().optional().describe('Message ID for the buster CLI'),
  context: githubContextSchema.optional().describe('GitHub context with optional properties'),
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
    context
  } = runDocsAgentParamsSchema.parse(params);

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
  await sandbox.fs.uploadFile(Buffer.from(JSON.stringify(context)), `${contextPath}/${contextFileName}`);

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    repositoryPath, // path
    branch, // branch "staging"
    undefined, // commit id
    env.GH_APP_ID, // username
    installationToken // password
  );

  const envExportCommands = [
    `export GITHUB_TOKEN=${installationToken}`,
    `export BUSTER_API_KEY=${apiKey}`,
    `export BUSTER_HOST=${env.BUSTER_HOST}`,
  ];

  await sandbox.process.createSession(sessionName);

  await sandbox.process.executeSessionCommand(sessionName, {
    command: `${envExportCommands.join(' && ')}`,
  });

  await sandbox.process.executeSessionCommand(sessionName, {
    command: `gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
  });

  // Build CLI command with optional parameters
  const cliArgs = [`--prompt "${prompt}"`];
  if (chatId) {
    cliArgs.push(`--chat-id "${chatId}"`);
  }
  if (messageId) {
    cliArgs.push(`--message-id "${messageId}"`);
  }
  if (context) {
    cliArgs.push(`--contextFilePath "${contextPath}/${contextFileName}"`);
  }

  await sandbox.process.executeSessionCommand(sessionName, {
    command: `cd ${workspacePath} && buster ${cliArgs.join(' ')}`,
    runAsync: true,
  });

  // Use for debugging logs if needed
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
  const { 
    installationToken, 
    repoUrl, 
    branch, 
    prompt, 
    apiKey, 
    chatId, 
    messageId,
    context
  } = runDocsAgentParamsSchema.parse(params);

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
  await sandbox.fs.uploadFile(Buffer.from(JSON.stringify(context)), `${contextPath}/${contextFileName}`);

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    repositoryPath, // path
    branch, // branch "staging"
    undefined, // commit id
    env.GH_APP_ID, // username
    installationToken // password
  );

  const envExportCommands = [
    `export GITHUB_TOKEN=${installationToken}`,
    `export BUSTER_API_KEY=${apiKey}`,
    `export BUSTER_HOST=${env.BUSTER_HOST}`,
  ];

  await sandbox.process.executeCommand(`gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
    repositoryPath);

  // Build CLI command with optional parameters
  const cliArgs = [`--prompt "${prompt}"`];
  // if (chatId) {
  //   cliArgs.push(`--chat-id "${chatId}"`);
  // }
  // if (messageId) {
  //   cliArgs.push(`--message-id "${messageId}"`);
  // }
  // if (context) {
  //   cliArgs.push(`--contextFilePath "${contextPath}/${contextFileName}"`);
  // }

  const command = await sandbox.process.executeCommand(`cd ${workspacePath} && buster ${cliArgs.join(' ')}`,
    repositoryPath, {
      GITHUB_TOKEN: installationToken,
      BUSTER_API_KEY: apiKey,
      BUSTER_HOST: env.BUSTER_HOST,
    });

  console.info(command);

  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
}