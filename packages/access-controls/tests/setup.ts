import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load environment variables from the workspace root
try {
  const envPath = resolve(__dirname, '../../../.env');
  const envContent = readFileSync(envPath, 'utf-8');

  // Parse the .env file
  const envVars = envContent.split('\n').reduce(
    (acc, line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=');
        // Remove quotes if present
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        acc[key.trim()] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  // Set environment variables
  Object.assign(process.env, envVars);

  console.log('Environment variables loaded from .env file');
} catch (error) {
  console.warn('Could not load .env file:', error);
}
