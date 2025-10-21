import { Daytona } from '@daytonaio/sdk';
import { z } from 'zod';

interface CheckCommandStatusParams {
  commandId: string;
  sessionId: string;
  sandboxId: string;
}

interface CommandStatus {
  exitCode: number | undefined;
  stdout?: string;
  stderr?: string;
}

// Define schema for environment validation
export const envSchema = z.object({
  DAYTONA_API_KEY: z.string().min(1, 'DAYTONA_API_KEY environment variable is required'),
});

export async function getCommandDetails(params: CheckCommandStatusParams): Promise<CommandStatus> {
  const { commandId, sessionId, sandboxId } = params;

  // Validate environment
  const env = envSchema.parse(process.env);

  // Initialize the Daytona client
  const daytona = new Daytona({ apiKey: env.DAYTONA_API_KEY, target: 'us' });

  const sandbox = await daytona.get(sandboxId);
  if (!sandbox) {
    throw new Error('Sandbox not found');
  }

  const session = await sandbox.process.getSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  const command = await sandbox.process.getSessionCommand(sessionId, commandId);
  if (!command) {
    throw new Error('Command not found');
  }

  const { stdout, stderr } = await sandbox.process.getSessionCommandLogs(sessionId, commandId);

  const result: CommandStatus = { exitCode: command.exitCode };

  if (stdout !== undefined) {
    result.stdout = stdout;
  }

  if (stderr !== undefined) {
    result.stderr = stderr;
  }

  return result;
}
