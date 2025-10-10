import { z } from 'zod';
import { createSandboxFromSnapshot } from '../management/create-sandbox';

// Define schema for environment validation
const envSchema = z.object({
  BUSTER_HOST: z.string().min(1, 'BUSTER_HOST environment variable is required'),
});

export async function runDocsAgent(
  installationToken: string,
  repoUrl: string,
  branch: string,
  prompt: string,
  apiKey: string
) {
  const sandbox = await createSandboxFromSnapshot('buster-docs-agent-snapshot');
  const workspacePath = `/workspace/repo/`;
  const busterAppGitUsername = 'buster-app';
  const busterAppGitEmail = 'buster-app@buster.so';
  const sessionName = 'buster-docs-agent-session';

  // Validate environment
  const env = envSchema.parse(process.env);

  await sandbox.git.clone(
    repoUrl, // url "https://github.com/buster-so/buster.git"
    workspacePath, // path
    branch, // branch "staging"
    undefined, // commit id
    '2058659', // username
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
  const command = await sandbox.process.executeSessionCommand(sessionName, {
    command: `cd ${workspacePath} && buster --prompt "${prompt}"`,
    runAsync: true,
  });

  const logs = await sandbox.process.getSessionCommandLogs(
    sessionName,
    command.cmdId ?? '',
    (stdout) => console.info('[STDOUT]:', stdout)
  );

  console.info('[SANDBOXLOGS]:', logs);
  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
}
