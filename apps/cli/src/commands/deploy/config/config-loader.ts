import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import yaml from 'js-yaml';
import {
  type BusterConfig,
  BusterConfigSchema,
  type DeployOptions,
  type ResolvedConfig,
  ResolvedConfigSchema,
} from '../schemas';

/**
 * Recursively search for buster.yml file in a directory and its subdirectories
 * Returns the first buster.yml or buster.yaml file found
 */
async function findBusterYmlFile(startDir: string): Promise<string | null> {
  // First normalize the path
  const searchDir = resolve(startDir);

  // If the path doesn't exist, return null
  if (!existsSync(searchDir)) {
    return null;
  }

  // If startDir is a file (e.g., if someone passed path to buster.yml directly),
  // check if it's a buster.yml file
  const stats = await stat(searchDir);
  if (stats.isFile()) {
    const filename = searchDir.split('/').pop();
    if (filename === 'buster.yml' || filename === 'buster.yaml') {
      return searchDir;
    }
    // If it's a different file, return null (don't search)
    return null;
  }

  // Check for buster.yml or buster.yaml in the current directory first
  const ymlPath = join(searchDir, 'buster.yml');
  const yamlPath = join(searchDir, 'buster.yaml');

  if (existsSync(ymlPath)) {
    return ymlPath;
  }
  if (existsSync(yamlPath)) {
    return yamlPath;
  }

  // Now recursively search subdirectories
  const entries = await readdir(searchDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Skip common directories that shouldn't be searched
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.next' ||
        entry.name === 'coverage' ||
        entry.name === '.turbo'
      ) {
        continue;
      }

      // Recursively search this subdirectory
      const subDirPath = join(searchDir, entry.name);
      const found = await findBusterYmlFile(subDirPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Load and parse a single buster.yml file
 */
async function loadSingleBusterConfig(configPath: string): Promise<BusterConfig | null> {
  try {
    const content = await readFile(configPath, 'utf-8');
    const rawConfig = yaml.load(content) as unknown;

    // Check for empty projects array before validation
    if (
      rawConfig &&
      typeof rawConfig === 'object' &&
      'projects' in rawConfig &&
      Array.isArray((rawConfig as Record<string, unknown>).projects) &&
      ((rawConfig as Record<string, unknown>).projects as unknown[]).length === 0
    ) {
      // Return a special indicator for empty projects
      return { projects: [] } as BusterConfig;
    }

    // Validate and parse with Zod schema
    const result = BusterConfigSchema.safeParse(rawConfig);

    if (result.success) {
      return result.data;
    }

    console.warn(`Warning: Invalid buster.yml at ${configPath}:`, result.error.issues);
    return null;
  } catch (error) {
    console.warn(`Warning: Failed to read ${configPath}:`, error);
    return null;
  }
}

/**
 * Find and load the buster.yml configuration file
 * Only loads a single buster.yml file (no merging of multiple files)
 * @returns The loaded config and the path to the config file
 * @throws Error if no buster.yml is found
 */
export async function loadBusterConfig(
  searchPath = '.'
): Promise<{ config: BusterConfig; configPath: string }> {
  const absolutePath = resolve(searchPath);

  // Check if the path exists
  if (!existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${absolutePath}`);
  }

  // Searching for buster.yml file

  // Find the buster.yml file (searches current dir and all subdirs)
  const configFile = await findBusterYmlFile(absolutePath);

  if (!configFile) {
    throw new Error(`No buster.yml found in ${absolutePath} or any of its subdirectories`);
  }

  // Found buster.yml

  // Load the configuration
  const config = await loadSingleBusterConfig(configFile);

  if (!config) {
    throw new Error(`Failed to parse buster.yml at ${configFile}`);
  }

  // Check for empty projects after successful parse
  if (config.projects && config.projects.length === 0) {
    throw new Error('No projects defined in buster.yml');
  }

  // If projects is undefined or null, it failed validation
  if (!config.projects) {
    throw new Error(`Failed to parse buster.yml at ${configFile}`);
  }

  // Loaded configuration successfully

  // Return both the config and its path
  return {
    config,
    configPath: configFile,
  };
}

/**
 * Resolve configuration hierarchy: CLI options > config file > defaults
 * Returns a fully resolved configuration object
 */
export function resolveConfiguration(
  config: BusterConfig,
  _options: DeployOptions,
  projectName?: string
): ResolvedConfig {
  // Select project to use
  const project = projectName
    ? config.projects.find((p) => p.name === projectName)
    : config.projects[0];

  if (!project) {
    throw new Error(
      projectName
        ? `Project '${projectName}' not found in buster.yml`
        : 'No projects defined in buster.yml'
    );
  }

  // Build resolved config from project
  const resolved: ResolvedConfig = {
    data_source_name: project.data_source,
    database: project.database,
    schema: project.schema,
    include: project.include,
    exclude: project.exclude,
  };

  // Validate resolved config
  const result = ResolvedConfigSchema.parse(resolved);
  return result;
}

/**
 * Get the base directory for a buster.yml file
 * Used for resolving relative paths in the config
 */
export async function getConfigBaseDir(configPath: string): Promise<string> {
  // If configPath is a directory, use it directly
  // Otherwise, use its parent directory
  if (existsSync(configPath)) {
    const stats = await stat(configPath);
    if (stats.isDirectory()) {
      return resolve(configPath);
    }
  }
  return resolve(join(configPath, '..'));
}

/**
 * Resolve model paths relative to config base directory
 */
export function resolveModelPaths(modelPaths: string[], baseDir: string): string[] {
  return modelPaths.map((path) => {
    // If path is absolute, use it directly
    if (path.startsWith('/')) {
      return path;
    }
    // Otherwise, resolve relative to base directory
    return resolve(baseDir, path);
  });
}
