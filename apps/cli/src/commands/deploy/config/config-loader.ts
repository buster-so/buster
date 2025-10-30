import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
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

  if (config.automation && config.automation.length > 0) {
    let repositoryName: string | undefined;
    for (const agent of config.automation) {
      if (agent.on.length > 0) {
        for (const trigger of agent.on) {
          if (trigger.repository) {
            repositoryName = trigger.repository;
          } else if (!trigger.repository && repositoryName) {
            trigger.repository = repositoryName;
          } else {
            const baseDir = await getConfigBaseDir(configFile);
            const findGitRepoName = await getGitRepositoryName(baseDir);
            if (findGitRepoName) {
              repositoryName = findGitRepoName;
              trigger.repository = findGitRepoName;
            } else {
              throw new Error(
                `No repository name set in ${configFile} and could not be determined from the directory structure`
              );
            }
          }
        }
      }
    }
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

/**
 * Get the git repository name from a directory
 * Traverses up the directory tree to find .git directory
 * Parses the repository name from the git config
 * @returns The repository name or undefined if not found
 */
export async function getGitRepositoryName(startDir: string): Promise<string | undefined> {
  let currentDir = resolve(startDir);

  // Traverse up until we find .git or reach root
  while (true) {
    const gitDir = join(currentDir, '.git');

    if (existsSync(gitDir)) {
      // Found .git directory, try to read config
      const configPath = join(gitDir, 'config');

      if (!existsSync(configPath)) {
        return undefined;
      }

      try {
        const configContent = await readFile(configPath, 'utf-8');

        // Parse git config to find remote origin URL
        // Look for url = ... under [remote "origin"]
        const urlMatch = configContent.match(/\[remote "origin"\][\s\S]*?url\s*=\s*(.+)/);

        if (!urlMatch || !urlMatch[1]) {
          return undefined;
        }

        const url = urlMatch[1].trim();

        // Extract repository name with owner from URL
        // Handle both SSH (git@github.com:owner/repo.git) and HTTPS (https://github.com/owner/repo.git) formats
        let repoName: string | undefined;

        // SSH format: git@github.com:owner/repo.git
        if (url.includes('@') && url.includes(':')) {
          const parts = url.split(':');
          if (parts.length >= 2) {
            // Get everything after the colon (owner/repo.git)
            repoName = parts.slice(1).join(':');
          }
        }
        // HTTPS format: https://github.com/owner/repo.git
        else if (url.includes('://')) {
          const parts = url.split('/');
          if (parts.length >= 2) {
            // Get the last two parts (owner/repo.git)
            repoName = parts.slice(-2).join('/');
          }
        }

        // Remove .git suffix if present
        if (repoName?.endsWith('.git')) {
          repoName = repoName.slice(0, -4);
        }

        return repoName;
      } catch {
        return undefined;
      }
    }

    // Move up one directory
    const parentDir = resolve(currentDir, '..');

    // If we've reached the root, stop
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}
