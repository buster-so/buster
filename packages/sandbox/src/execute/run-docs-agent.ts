import { createSandboxFromSnapshot } from '../management/create-sandbox';

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
  ];
  if (process.env.ENVIRONMENT === 'development' && process.env.BUSTER_HOST) {
    envExportCommands.push(`export BUSTER_HOST=${process.env.BUSTER_HOST}`);
  }

  await sandbox.process.createSession(sessionName);
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `${envExportCommands.join(' && ')}`,
  });
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `gh auth setup-git && git config --global user.email "${busterAppGitEmail}" && git config --global user.name "${busterAppGitUsername}"`,
  });
  await sandbox.process.executeSessionCommand(sessionName, {
    command: `cd ${workspacePath} && buster --prompt "${prompt}"`,
    runAsync: true,
  });
  console.info('[Daytona Sandbox Started]', { sessionId: sessionName, sandboxId: sandbox.id });
}
