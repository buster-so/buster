import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { wrapTraced } from 'braintrust';
import type { Ignore } from 'ignore';
import ignore from 'ignore';
import * as yaml from 'yaml';
import { DbtProjectFileModelPathsSchema } from './types';

export async function findDbtModelPathsStep(): Promise<string[]> {
  return wrapTraced(
    async () => {
      return await findDbtModelPaths();
    },
    {
      name: 'Find DBT Model Paths Step',
    }
  )();
}

/**
 * Collect all ignore patterns from base directory to current directory
 * This properly handles pattern inheritance like git does
 */
async function collectIgnorePatterns(baseDir: string, currentDir: string): Promise<Ignore> {
  const ig = ignore();
  const patterns: string[] = [];

  // Get all directories from base to current
  const relativePath = path.relative(baseDir, currentDir);
  const pathParts = relativePath ? relativePath.split(path.sep) : [];

  // Start with base directory and walk down to current directory
  let checkDir = baseDir;
  const dirsToCheck = [checkDir];

  for (const part of pathParts) {
    checkDir = path.join(checkDir, part);
    dirsToCheck.push(checkDir);
  }

  // Collect patterns from all .gitignore and .dbtignore files
  for (const dir of dirsToCheck) {
    // Try to read .gitignore
    try {
      const gitignorePath = path.join(dir, '.gitignore');
      const gitignoreContent = await readFile(gitignorePath, 'utf-8');
      patterns.push(gitignoreContent);
    } catch {
      // .gitignore doesn't exist in this directory, that's okay
    }

    // Try to read .dbtignore
    try {
      const dbtignorePath = path.join(dir, '.dbtignore');
      const dbtignoreContent = await readFile(dbtignorePath, 'utf-8');
      patterns.push(dbtignoreContent);
    } catch {
      // .dbtignore doesn't exist in this directory, that's okay
    }
  }

  // Add all collected patterns
  if (patterns.length > 0) {
    ig.add(patterns.join('\n'));
  }

  return ig;
}

/**
 * Check if a path should be ignored based on ignore patterns
 */
function shouldIgnorePath(fullPath: string, baseDir: string, ig: Ignore): boolean {
  // Get relative path from base directory
  const relativePath = path.relative(baseDir, fullPath);

  // Always skip common build/dependency directories
  const pathParts = relativePath.split(path.sep);
  const commonIgnored = ['node_modules', '.git', 'dist', 'build', '.next'];
  if (pathParts.some((part) => commonIgnored.includes(part))) {
    return true;
  }

  // Check against ignore patterns
  return ig.ignores(relativePath);
}

/**
 * Recursively search for dbt_project.yml files
 */
async function walkDirectory(dir: string, foundPaths: string[], baseDir: string): Promise<void> {
  try {
    // Collect all ignore patterns from base to current directory
    const ig = await collectIgnorePatterns(baseDir, dir);

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip if this path matches ignore patterns
      if (shouldIgnorePath(fullPath, baseDir, ig)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        await walkDirectory(fullPath, foundPaths, baseDir);
      } else if (entry.isFile() && entry.name === 'dbt_project.yml') {
        foundPaths.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
    console.warn(`Could not read directory ${dir}:`, error);
  }
}

/**
 * Parse a dbt_project.yml file and extract model-paths
 */
async function parseDbtProjectFile(filePath: string): Promise<string[]> {
  try {
    const fileContent = await readFile(filePath, 'utf-8');
    const parsedYaml = yaml.parse(fileContent);

    // Validate and extract model-paths
    const result = DbtProjectFileModelPathsSchema.safeParse(parsedYaml);

    if (!result.success) {
      console.warn(`No model-paths found in ${filePath}:`, result.error.message);
      return [];
    }

    // Get the directory containing the dbt_project.yml
    const projectDir = path.dirname(filePath);

    // Resolve model paths relative to the dbt project directory
    const resolvedPaths = result.data['model-paths'].map((modelPath: string) => {
      return path.resolve(projectDir, modelPath);
    });

    console.info(
      `Found ${resolvedPaths.length} model path(s) in ${filePath}: ${resolvedPaths.join(', ')}`
    );

    return resolvedPaths;
  } catch (error) {
    console.warn(`Error parsing ${filePath}:`, error);
    return [];
  }
}

async function findDbtModelPaths(): Promise<string[]> {
  const currentDirectory = process.cwd();
  const dbtProjectFiles: string[] = [];

  console.info(`Searching for dbt_project.yml files in ${currentDirectory}`);

  await walkDirectory(currentDirectory, dbtProjectFiles, currentDirectory);

  console.info(
    `Found ${dbtProjectFiles.length} dbt_project.yml file(s): ${dbtProjectFiles.join(', ')}`
  );

  // Parse all dbt_project.yml files and extract model paths
  const allModelPaths: string[] = [];

  for (const projectFile of dbtProjectFiles) {
    const modelPaths = await parseDbtProjectFile(projectFile);
    allModelPaths.push(...modelPaths);
  }

  console.info(`Total model paths found across all dbt projects: ${allModelPaths.length}`);

  return allModelPaths;
}
