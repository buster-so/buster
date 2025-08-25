import { z } from 'zod';

// Environment variables are loaded automatically from .env file by Next.js
// For server-side secrets, use @buster/secrets package

const isServer = typeof window === 'undefined';

if (!isServer) {
  throw new Error('env.mjs is only meant to be used on the server');
}

const clientEnvSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      errorMap: () => ({ message: 'NODE_ENV must be development, production, or test' })
    })
    .default('development'),

  // API URLs
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_API_URL is required' })
    .url({ message: 'NEXT_PUBLIC_API_URL must be a valid URL' }),
  NEXT_PUBLIC_API2_URL: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_API2_URL is required' })
    .url({ message: 'NEXT_PUBLIC_API2_URL must be a valid URL' }),
  NEXT_PUBLIC_WEB_SOCKET_URL: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_WEB_SOCKET_URL is required' })
    .url({ message: 'NEXT_PUBLIC_WEB_SOCKET_URL must be a valid URL' })
    .optional(),
  NEXT_PUBLIC_URL: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_URL is required' })
    .url({ message: 'NEXT_PUBLIC_URL must be a valid URL' }),

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .url({ message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }),

  // PostHog analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z
    .string()
    .url({ message: 'NEXT_PUBLIC_POSTHOG_HOST must be a valid URL' })
    .optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_ENV_ID: z.string().optional(),

  // Development/Testing credentials
  NEXT_PUBLIC_USER: z.string().optional(),
  NEXT_PUBLIC_USER_PASSWORD: z.string().optional(),
  NEXT_PUBLIC_ENABLE_TANSTACK_PANEL: z.string().optional()
});

const serverEnvSchema = z.object({});

// Parse and validate server-only environment variables
let serverEnv;
let clientEnv;

try {
  serverEnv = serverEnvSchema.parse(process.env);
  console.log('Successfully parsed server environment variables');
  clientEnv = clientEnvSchema.parse(process.env);
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
