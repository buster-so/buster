import { z } from 'zod';

const envSchema = z.object({
  // Required for API communication
  BUSTER_API_URL: z.string().url(),
  
  // Optional environment variables
  BUSTER_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BUSTER_CONFIG_DIR: z.string().optional(),
  BUSTER_CACHE_DIR: z.string().optional(),
  BUSTER_AUTO_UPDATE: z.string().optional(),
  BUSTER_TELEMETRY_DISABLED: z.string().optional(),
});

try {
  envSchema.parse(process.env);
  console.log('✅ Environment variables validated successfully');
} catch (error) {
  console.error('❌ Environment validation failed:');
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}