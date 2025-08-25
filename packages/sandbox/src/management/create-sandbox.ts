import { Daytona } from '@daytonaio/sdk';
import { z } from 'zod';
import { getSecret } from '@buster/secrets';

// Define schema for sandbox options
const createSandboxOptionsSchema = z.object({
  language: z.string().default('typescript').optional(),
});

export type CreateSandboxOptions = z.infer<typeof createSandboxOptionsSchema>;

export async function createSandbox(options: CreateSandboxOptions = {}) {
  // Validate options
  const validatedOptions = createSandboxOptionsSchema.parse(options);

  // Get API key from secrets
  const apiKey = await getSecret('DAYTONA_API_KEY');

  // Initialize the Daytona client
  const daytona = new Daytona({ apiKey, target: 'us' });

  // Create the Sandbox instance
  const sandbox = await daytona.create({
    language: validatedOptions.language || 'typescript',
  });

  return sandbox;
}
