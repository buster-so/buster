import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ProjectConfig } from './types.js';

interface InitOptions {
  name: string;
  path: string;
}

export async function initializeProject(options: InitOptions): Promise<void> {
  const projectPath = path.join(options.path, 'buster');
  
  // Check if buster folder already exists
  try {
    await fs.access(projectPath);
    throw new Error('A buster folder already exists in this directory');
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  // Create folder structure
  await fs.mkdir(projectPath, { recursive: true });
  await fs.mkdir(path.join(projectPath, 'docs'), { recursive: true });
  await fs.mkdir(path.join(projectPath, 'metadata'), { recursive: true });
  
  // Create buster.yml
  const config: ProjectConfig = {
    version: '1.0',
    projectName: options.name,
    createdAt: new Date().toISOString(),
  };
  
  const yamlContent = yaml.dump(config, {
    lineWidth: -1,
    quotingType: '"',
  });
  
  await fs.writeFile(
    path.join(projectPath, 'buster.yml'),
    yamlContent,
    'utf-8'
  );
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 1500));
}