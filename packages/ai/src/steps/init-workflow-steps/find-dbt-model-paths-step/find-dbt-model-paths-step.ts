import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { wrapTraced } from 'braintrust';
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
 * Recursively search for dbt_project.yml files
 */
async function walkDirectory(dir: string, foundPaths: string[]): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip common directories that shouldn't contain dbt projects
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
          await walkDirectory(fullPath, foundPaths);
        }
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

  await walkDirectory(currentDirectory, dbtProjectFiles);

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
