import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { wrapTraced } from 'braintrust';
import type { ModelQueueItem } from './types';

/**
 * Directories to skip when walking model paths
 */
const EXCLUDED_DIRECTORIES = ['analysis', 'tests', 'snapshots', 'macros', 'target'];

/**
 * Check if a directory should be skipped during walk
 */
function shouldSkipDirectory(dirName: string): boolean {
  // Skip hidden directories (starting with .)
  if (dirName.startsWith('.')) {
    return true;
  }

  // Skip excluded directories
  return EXCLUDED_DIRECTORIES.includes(dirName);
}

/**
 * Check if a file should be included as a model
 */
export function isValidModelFile(filePath: string, fileName: string): boolean {
  // Must have .sql extension
  if (!fileName.endsWith('.sql')) {
    return false;
  }

  // Check if file is in an excluded directory
  const pathParts = filePath.split(path.sep);
  for (const part of pathParts) {
    if (shouldSkipDirectory(part)) {
      return false;
    }
  }

  return true;
}

/**
 * Recursively walk a model directory and collect all .sql file paths
 */
export async function walkModelDirectory(modelPath: string): Promise<string[]> {
  const sqlFiles: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          if (!shouldSkipDirectory(entry.name)) {
            await walk(fullPath);
          }
        } else if (entry.isFile() && isValidModelFile(fullPath, entry.name)) {
          sqlFiles.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${currentPath}:`, error);
    }
  }

  await walk(modelPath);
  return sqlFiles;
}

/**
 * Build metadata for a single model file
 */
export function buildModelQueueItem(absolutePath: string, modelDirectory: string): ModelQueueItem {
  const fileName = path.basename(absolutePath);
  const modelName = fileName.replace('.sql', '');
  const relativePath = path.relative(modelDirectory, absolutePath);

  return {
    absolutePath,
    relativePath,
    fileName,
    modelName,
    modelDirectory,
  };
}

/**
 * Build queue of all models from the given model paths
 */
export async function buildModelsQueue(modelPaths: string[]): Promise<ModelQueueItem[]> {
  const allModels: ModelQueueItem[] = [];

  for (const modelPath of modelPaths) {
    const sqlFiles = await walkModelDirectory(modelPath);

    for (const sqlFile of sqlFiles) {
      const queueItem = buildModelQueueItem(sqlFile, modelPath);
      allModels.push(queueItem);
    }
  }

  return allModels;
}

/**
 * Build Models Queue Step - Find all dbt model files to document
 */
export async function buildModelsQueueStep(modelPaths: string[]): Promise<ModelQueueItem[]> {
  return wrapTraced(
    async () => {
      return await buildModelsQueue(modelPaths);
    },
    {
      name: 'Build Models Queue Step',
    }
  )();
}
