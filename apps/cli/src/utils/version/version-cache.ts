import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { type VersionCache, VersionCacheSchema } from './version-schemas';

const CACHE_DIR = join(homedir(), '.buster');
const CACHE_FILE = join(CACHE_DIR, 'update-check.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Ensure the cache directory exists
 */
async function ensureCacheDir(): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true, mode: 0o700 });
  } catch {
    // Directory might already exist, that's fine
  }
}

/**
 * Load cached version information
 */
export async function loadVersionCache(): Promise<VersionCache | null> {
  try {
    const data = await readFile(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return VersionCacheSchema.parse(parsed);
  } catch {
    // Cache doesn't exist or is invalid
    return null;
  }
}

/**
 * Save version information to cache
 */
export async function saveVersionCache(cache: VersionCache): Promise<void> {
  try {
    await ensureCacheDir();
    const validated = VersionCacheSchema.parse(cache);
    await writeFile(CACHE_FILE, JSON.stringify(validated, null, 2), {
      mode: 0o600,
    });
  } catch {
    // Silently fail - caching is not critical
  }
}

/**
 * Check if cache is still valid (not expired)
 */
export function isCacheValid(cache: VersionCache): boolean {
  const now = Date.now();
  const age = now - cache.checkedAt;
  return age < CACHE_TTL;
}

/**
 * Get cached version if valid, otherwise return null
 */
export async function getCachedVersion(): Promise<VersionCache | null> {
  const cache = await loadVersionCache();
  if (cache && isCacheValid(cache)) {
    return cache;
  }
  return null;
}

/**
 * Clear the version cache
 */
export async function clearVersionCache(): Promise<void> {
  try {
    await unlink(CACHE_FILE);
  } catch {
    // Cache file might not exist, that's fine
  }
}

/**
 * Check if update checks are disabled via environment variable
 */
export function isUpdateCheckDisabled(): boolean {
  return (
    process.env.BUSTER_NO_UPDATE_CHECK === 'true' ||
    process.env.BUSTER_NO_UPDATE_CHECK === '1' ||
    process.env.CI === 'true' ||
    process.env.CI === '1'
  );
}
