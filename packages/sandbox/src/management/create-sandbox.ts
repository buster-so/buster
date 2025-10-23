import { Daytona, type Sandbox } from '@daytonaio/sdk';
import { z } from 'zod';

// Define schema for environment validation
export const envSchema = z.object({
  DAYTONA_API_KEY: z.string().min(1, 'DAYTONA_API_KEY environment variable is required'),
});

export async function createSandboxFromSnapshot(snapshotName: string): Promise<Sandbox> {
  const daytonaApiKeyExists = envSchema.safeParse(process.env);
  if (!daytonaApiKeyExists.success) {
    throw new Error('DAYTONA_API_KEY environment variable is required');
  }

  const daytona = new Daytona({ apiKey: daytonaApiKeyExists.data.DAYTONA_API_KEY, target: 'us' });

  const sandbox = await daytona.create({
    snapshot: snapshotName,
    autoStopInterval: 5, // Will stop the sandbox after 5 minutes of inactivity,
    autoDeleteInterval: 60, // Will delete the sandbox 1hr after it stops
  });

  return sandbox;
}

export async function createSandboxWithBusterCLI(
  snapshotName: string,
  fallbackSnapshot?: string
): Promise<Sandbox> {
  let sandbox = await createSandboxFromSnapshot(snapshotName);
  try {
    await sandbox.process.executeCommand(
      `curl -fsSL https://raw.githubusercontent.com/buster-so/buster/main/scripts/install.sh | bash`
    );
    await sandbox.process.executeCommand(
      `export PATH="$HOME/.local/bin:$PATH" && buster --version`
    );
  } catch (error) {
    console.error('Failed to install Buster CLI', error);
    if (fallbackSnapshot) {
      console.info('Using Pre-Installed Fallback Snapshot');
      sandbox = await createSandboxFromSnapshot(fallbackSnapshot);
    } else {
      throw new Error('Failed to create sandbox with Buster CLI');
    }
  }
  return sandbox;
}
