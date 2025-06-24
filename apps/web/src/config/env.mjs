import { z } from 'zod';
import clientEnv from './envClient.mjs';
import { isServer } from '@tanstack/react-query';

if (!isServer) {
  throw new Error('env.mjs is only meant to be used on the server');
}

const serverEnvSchema = z.object({
  // Slack integration (private)
  NEXT_SLACK_APP_SUPPORT_URL: z
    .string()
    .url({ message: 'NEXT_SLACK_APP_SUPPORT_URL must be a valid URL' })
    .optional()
});

// Parse and validate server-only environment variables
let serverEnv;

try {
  serverEnv = serverEnvSchema.parse(process.env);
} catch (error) {
  console.error('❌ Server environment validation failed!');
  console.error('');

  if (error instanceof z.ZodError) {
    console.error('The following private environment variables are invalid or missing:');
    console.error('');

    error.errors.forEach((err) => {
      const path = err.path.join('.');
      console.error(`  • ${path}: ${err.message}`);
    });

    console.error('');
    console.error(
      'Please check your .env file and ensure all required private variables are set correctly.'
    );
  } else {
    console.error('Unexpected error during server environment validation:', error);
  }

  console.error('');
  console.error('Build cannot continue with invalid server environment configuration.');

  // Throw error to prevent build from continuing
  process.exit(1);
}

// Combine client and server environment variables
const env = {
  ...clientEnv,
  ...serverEnv
};

export { env };
export default env;
