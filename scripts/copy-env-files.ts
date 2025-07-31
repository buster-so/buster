#!/usr/bin/env tsx

import { promises as fs } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const SOURCE_REPO = join(process.env.HOME!, 'buster', 'buster');
const TARGET_REPO = process.cwd();

async function findEnvFiles(dir: string): Promise<string[]> {
  const envFiles: string[] = [];
  
  async function walkDir(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        const relativePath = relative(dir, fullPath);
        
        if (entry.isDirectory()) {
          // Skip .git and node_modules directories
          if (entry.name === '.git' || entry.name === 'node_modules') continue;
          await walkDir(fullPath);
        } else if (entry.name.startsWith('.env')) {
          envFiles.push(relativePath);
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.warn(`Skipping directory: ${currentDir}`);
    }
  }
  
  await walkDir(dir);
  return envFiles;
}

async function copyEnvFiles() {
  try {
    console.info(`Searching for .env files in ${SOURCE_REPO}...`);
    
    const envFiles = await findEnvFiles(SOURCE_REPO);

    if (envFiles.length === 0) {
      console.warn('No .env files found in source repository');
      return;
    }

    console.info(`Found ${envFiles.length} .env file(s):`);
    envFiles.forEach(file => console.info(`  - ${file}`));

    console.info('\nCopying files...');

    for (const envFile of envFiles) {
      const sourcePath = join(SOURCE_REPO, envFile);
      const targetPath = join(TARGET_REPO, envFile);
      const targetDir = dirname(targetPath);

      try {
        await fs.mkdir(targetDir, { recursive: true });
        
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(targetPath, content);
        
        console.info(`  ✓ Copied ${envFile}`);
      } catch (error) {
        console.error(`  ✗ Failed to copy ${envFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.info('\nDone! All .env files have been copied to the worktree.');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

copyEnvFiles();