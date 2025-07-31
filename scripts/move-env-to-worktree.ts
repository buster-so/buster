#!/usr/bin/env tsx

import { promises as fs } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';

const SOURCE_REPO = join(process.env.HOME!, 'buster', 'buster');
const TARGET_REPO = process.cwd();

interface GitignoreRules {
  patterns: string[];
  directory: string;
}

// Simple gitignore pattern matcher
function matchesGitignorePattern(path: string, pattern: string): boolean {
  // Remove leading/trailing slashes
  pattern = pattern.trim();
  if (pattern.startsWith('#') || pattern === '') return false;
  
  const isNegation = pattern.startsWith('!');
  if (isNegation) pattern = pattern.slice(1);
  
  // Handle directory-only patterns (ending with /)
  const isDirPattern = pattern.endsWith('/');
  if (isDirPattern) pattern = pattern.slice(0, -1);
  
  // Simple glob matching (basic implementation)
  // Convert pattern to regex
  let regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\*\*/g, '.*');
  
  // If pattern doesn't start with /, it can match anywhere
  if (!pattern.startsWith('/')) {
    regexPattern = `(^|/)${regexPattern}`;
  } else {
    regexPattern = `^${regexPattern.slice(1)}`;
  }
  
  if (isDirPattern) {
    regexPattern += '(/|$)';
  } else {
    regexPattern += '(/|$)';
  }
  
  const regex = new RegExp(regexPattern);
  const matches = regex.test(path);
  
  return isNegation ? !matches : matches;
}

async function loadGitignoreRules(dir: string): Promise<string[]> {
  try {
    const gitignorePath = join(dir, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch {
    return [];
  }
}

function isIgnored(path: string, gitignoreStack: GitignoreRules[]): boolean {
  for (const rules of gitignoreStack) {
    const relativePath = relative(rules.directory, path);
    if (relativePath && !relativePath.startsWith('..')) {
      for (const pattern of rules.patterns) {
        if (matchesGitignorePattern(relativePath, pattern)) {
          return true;
        }
      }
    }
  }
  return false;
}

async function findEnvAndClaudeFiles(dir: string, baseDir: string = dir): Promise<{ envFiles: string[], claudeDirs: string[] }> {
  const envFiles: string[] = [];
  const claudeDirs: string[] = [];
  
  async function walkDir(currentDir: string, gitignoreStack: GitignoreRules[]) {
    try {
      // Load gitignore rules for current directory
      const localRules = await loadGitignoreRules(currentDir);
      if (localRules.length > 0) {
        gitignoreStack = [...gitignoreStack, { patterns: localRules, directory: currentDir }];
      }
      
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        const relativePath = relative(baseDir, fullPath);
        
        if (entry.isDirectory()) {
          // Always skip .git directory
          if (entry.name === '.git') continue;
          
          // Check for .claude directory
          if (entry.name === '.claude') {
            claudeDirs.push(relativePath);
            continue; // Don't recurse into .claude directories
          }
          
          // Check if directory is ignored
          if (isIgnored(fullPath, gitignoreStack)) {
            continue;
          }
          await walkDir(fullPath, gitignoreStack);
        } else if (entry.name.startsWith('.env') && !entry.name.endsWith('.example')) {
          // Always include .env files (but not .env.example), regardless of gitignore rules
          envFiles.push(relativePath);
        } else {
          // For non-.env files, check if they're ignored
          if (isIgnored(fullPath, gitignoreStack)) {
            continue;
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.warn(`Skipping directory: ${currentDir}`);
    }
  }
  
  await walkDir(dir, []);
  return { envFiles, claudeDirs };
}

async function copyDirectory(sourceDir: string, targetDir: string): Promise<void> {
  try {
    await fs.mkdir(targetDir, { recursive: true });
    
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = join(sourceDir, entry.name);
      const targetPath = join(targetDir, entry.name);
      
      if (entry.isDirectory()) {
        await copyDirectory(sourcePath, targetPath);
      } else {
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(targetPath, content);
      }
    }
  } catch (error) {
    throw new Error(`Failed to copy directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function copyEnvAndClaudeFiles() {
  try {
    console.info(`Searching for .env files and .claude folders in ${SOURCE_REPO}...`);
    
    const { envFiles, claudeDirs } = await findEnvAndClaudeFiles(SOURCE_REPO);

    if (envFiles.length === 0 && claudeDirs.length === 0) {
      console.warn('No .env files or .claude folders found in source repository');
      return;
    }

    console.info(`Found ${envFiles.length} .env file(s) and ${claudeDirs.length} .claude folder(s)`);

    // Copy .env files
    for (const envFile of envFiles) {
      const sourcePath = join(SOURCE_REPO, envFile);
      const targetPath = join(TARGET_REPO, envFile);
      const targetDir = dirname(targetPath);

      console.info(`Copying ${envFile}...`);

      try {
        await fs.mkdir(targetDir, { recursive: true });
        
        const content = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(targetPath, content);
        
        console.info(`  ✓ Copied to ${relative(TARGET_REPO, targetPath)}`);
      } catch (error) {
        console.error(`  ✗ Failed to copy ${envFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Copy .claude directories
    for (const claudeDir of claudeDirs) {
      const sourcePath = join(SOURCE_REPO, claudeDir);
      const targetPath = join(TARGET_REPO, claudeDir);

      console.info(`Copying ${claudeDir}/...`);

      try {
        await copyDirectory(sourcePath, targetPath);
        console.info(`  ✓ Copied to ${relative(TARGET_REPO, targetPath)}/`);
      } catch (error) {
        console.error(`  ✗ Failed to copy ${claudeDir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.info('\nDone! All .env files and .claude folders have been copied to the worktree.');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

copyEnvAndClaudeFiles();