import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import { debugLogger } from './debug-logger';

// Credentials schema
const credentialsSchema = z.object({
  apiKey: z.string().min(1),
  apiUrl: z.string().url(),
});

export type Credentials = z.infer<typeof credentialsSchema>;

// Default configuration
const DEFAULT_API_URL = 'https://api2.buster.so';
const CREDENTIALS_DIR = join(homedir(), '.buster');
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, 'credentials.json');

/**
 * Ensures the credentials directory exists
 */
async function ensureCredentialsDir(): Promise<void> {
  try {
    await mkdir(CREDENTIALS_DIR, { recursive: true, mode: 0o700 });
  } catch (error) {
    debugLogger.error('Failed to create credentials directory:', error);
    throw new Error('Unable to create credentials directory');
  }
}

/**
 * Saves credentials to the local filesystem
 * @param credentials - The credentials to save
 */
export async function saveCredentials(credentials: Credentials): Promise<void> {
  try {
    // Validate credentials
    const validated = credentialsSchema.parse(credentials);

    // Ensure directory exists
    await ensureCredentialsDir();

    // Write credentials with restricted permissions
    await writeFile(CREDENTIALS_FILE, JSON.stringify(validated, null, 2), { mode: 0o600 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid credentials: ${error.errors.map((e) => e.message).join(', ')}`);
    }
    debugLogger.error('Failed to save credentials:', error);
    throw new Error('Unable to save credentials');
  }
}

/**
 * Loads credentials from the local filesystem
 * @returns The saved credentials or null if not found
 */
export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const data = await readFile(CREDENTIALS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return credentialsSchema.parse(parsed);
  } catch (_error) {
    // File doesn't exist or is invalid
    return null;
  }
}

/**
 * Deletes saved credentials
 */
export async function deleteCredentials(): Promise<void> {
  try {
    await unlink(CREDENTIALS_FILE);
  } catch (error) {
    // Ignore if file doesn't exist
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      debugLogger.error('Failed to delete credentials:', error);
      throw new Error('Unable to delete credentials');
    }
  }
}

/**
 * Gets credentials from environment variables or saved file
 * @returns Credentials with environment variables taking precedence
 */
export async function getCredentials(): Promise<Credentials | null> {
  const envApiKey = process.env.BUSTER_API_KEY;
  const envApiUrl = process.env.BUSTER_HOST || process.env.BUSTER_API_URL;

  // If we have env vars, use them (they take precedence)
  if (envApiKey) {
    return {
      apiKey: envApiKey,
      apiUrl: envApiUrl || DEFAULT_API_URL,
    };
  }

  // Otherwise, try to load from file
  const saved = await loadCredentials();
  if (saved) {
    // Apply env overrides if present
    return {
      apiKey: saved.apiKey,
      apiUrl: envApiUrl || saved.apiUrl,
    };
  }

  return null;
}

/**
 * Checks if the user has valid credentials configured
 * @returns true if credentials are available, false otherwise
 */
export async function hasCredentials(): Promise<boolean> {
  const creds = await getCredentials();
  return creds !== null && creds.apiKey.length > 0;
}
