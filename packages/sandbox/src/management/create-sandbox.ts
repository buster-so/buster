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

export async function createSandboxFromSnapshot(snapshotName: string) {
  const daytonaApiKeyExists = envSchema.safeParse(process.env);
  if (!daytonaApiKeyExists.success) {
    throw new Error('DAYTONA_API_KEY environment variable is required');
  }

  const daytona = new Daytona({ apiKey: daytonaApiKeyExists.data.DAYTONA_API_KEY, target: 'us' });

  const sandbox = await daytona.create({
    snapshot: snapshotName,
    autoStopInterval: 5, // Will stop the sandbox after 5 minutes of inactivity,
    autoDeleteInterval: 60, // Will delete the sandbox 1hr after it stops
  })

  return sandbox;
}
