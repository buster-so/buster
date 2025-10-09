import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Glob } from 'bun';
import micromatch from 'micromatch';

interface FileSearchOptions {
  cwd?: string;
  maxResults?: number;
  includeHidden?: boolean;
}

interface FileSearchResult {
  path: string;
  relativePath: string;
  name: string;
}

class FileSearcher {
  public cwd: string;
  private fileCache: string[] | null = null;
  private gitignorePatterns: string[] | null = null;
  private lastCacheTime = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  constructor(cwd: string = process.cwd()) {
    this.cwd = resolve(cwd);
  }

  private parseGitignore(content: string): string[] {
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((pattern) => {
        // Convert gitignore patterns to glob patterns
        if (pattern.startsWith('!')) {
          return pattern; // Keep negation patterns as-is
        }
        if (pattern.startsWith('/')) {
          return pattern.slice(1); // Remove leading slash for relative patterns
        }
        if (!pattern.includes('/')) {
          // Match file/folder anywhere in tree
          return `**/${pattern}`;
        }
        return pattern;
      });
  }

  private loadGitignorePatterns(): string[] {
    if (this.gitignorePatterns !== null) {
      return this.gitignorePatterns;
    }

    const patterns: string[] = [
      // Default exclusions
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.next/**',
      '**/coverage/**',
      '**/.cache/**',
    ];

    // Load .gitignore if it exists
    const gitignorePath = join(this.cwd, '.gitignore');
    if (existsSync(gitignorePath)) {
      try {
        const content = readFileSync(gitignorePath, 'utf-8');
        const gitignorePatterns = this.parseGitignore(content);
        patterns.push(...gitignorePatterns);
      } catch (error) {
        console.error('Failed to read .gitignore:', error);
      }
    }

    // Load .gitignore from parent directories up to root
    let currentDir = resolve(this.cwd, '..');
    const root = resolve('/');
    while (currentDir !== root) {
      const parentGitignorePath = join(currentDir, '.gitignore');
      if (existsSync(parentGitignorePath)) {
        try {
          const content = readFileSync(parentGitignorePath, 'utf-8');
          const gitignorePatterns = this.parseGitignore(content);
          // Adjust patterns relative to our cwd
          const adjustedPatterns = gitignorePatterns.map((pattern) => {
            if (pattern.startsWith('!') || pattern.startsWith('**/')) {
              return pattern;
            }
            return `**/${pattern}`;
          });
          patterns.push(...adjustedPatterns);
        } catch (error) {
          // Silently ignore
        }
      }
      const parentDir = resolve(currentDir, '..');
      if (parentDir === currentDir) break; // Reached root
      currentDir = parentDir;
    }

    this.gitignorePatterns = patterns;
    return patterns;
  }

  private async getAllFiles(includeHidden = false): Promise<string[]> {
    const now = Date.now();

    // Return cached files if still valid
    if (this.fileCache && now - this.lastCacheTime < this.CACHE_TTL) {
      return this.fileCache;
    }

    const ignorePatterns = this.loadGitignorePatterns();

    // Use Bun's Glob to find all files
    const glob = new Glob('**/*');

    const allFiles: string[] = [];

    for await (const file of glob.scan({ cwd: this.cwd, onlyFiles: true, dot: includeHidden })) {
      // Check if file should be ignored
      const shouldIgnore = micromatch.isMatch(file, ignorePatterns, {
        dot: true,
        contains: true,
      });

      if (!shouldIgnore) {
        allFiles.push(file);
      }
    }

    // Update cache
    this.fileCache = allFiles.sort();
    this.lastCacheTime = now;

    return this.fileCache;
  }

  async searchFiles(query: string, options: FileSearchOptions = {}): Promise<FileSearchResult[]> {
    const { cwd = this.cwd, maxResults = 10, includeHidden = false } = options;

    // Update cwd if different
    if (cwd !== this.cwd) {
      this.cwd = resolve(cwd);
      this.fileCache = null; // Clear cache when directory changes
      this.gitignorePatterns = null;
    }

    const files = await this.getAllFiles(includeHidden);

    if (!query) {
      // Return first N files if no query
      return files.slice(0, maxResults).map((file) => ({
        path: join(this.cwd, file),
        relativePath: file,
        name: file.split('/').pop() || file,
      }));
    }

    // Fuzzy search - split query into parts and check if all parts are in the path
    const queryParts = query.toLowerCase().split('').filter(Boolean);

    const scoredFiles = files
      .map((file) => {
        const lowerFile = file.toLowerCase();
        const fileName = file.split('/').pop() || '';
        const lowerFileName = fileName.toLowerCase();

        // Check if all query parts appear in order in the file path
        let score = 0;
        let lastIndex = -1;
        let allPartsFound = true;

        for (const part of queryParts) {
          const indexInPath = lowerFile.indexOf(part, lastIndex + 1);
          const indexInName = lowerFileName.indexOf(part, lastIndex + 1);

          if (indexInPath === -1) {
            allPartsFound = false;
            break;
          }

          // Prefer matches in filename over path
          if (indexInName !== -1) {
            score += 2;
            lastIndex = indexInName;
          } else {
            score += 1;
            lastIndex = indexInPath;
          }

          // Bonus for consecutive matches
          if (lastIndex === indexInPath - 1) {
            score += 0.5;
          }
        }

        if (!allPartsFound) {
          return null;
        }

        // Bonus for exact substring match
        if (lowerFile.includes(query.toLowerCase())) {
          score += 5;
        }

        // Bonus for matching at start of filename
        if (lowerFileName.startsWith(query.toLowerCase())) {
          score += 10;
        }

        // Penalty for depth
        const depth = file.split('/').length;
        score -= depth * 0.1;

        return {
          file,
          score,
        };
      })
      .filter((item): item is { file: string; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return scoredFiles.map(({ file }) => ({
      path: join(this.cwd, file),
      relativePath: file,
      name: file.split('/').pop() || file,
    }));
  }

  clearCache(): void {
    this.fileCache = null;
    this.gitignorePatterns = null;
    this.lastCacheTime = 0;
  }
}

// Export singleton instance
let searcherInstance: FileSearcher | null = null;

export function getFileSearcher(cwd?: string): FileSearcher {
  if (!searcherInstance || (cwd && resolve(cwd) !== searcherInstance.cwd)) {
    searcherInstance = new FileSearcher(cwd);
  }
  return searcherInstance;
}

export async function searchFiles(
  query: string,
  options?: FileSearchOptions
): Promise<FileSearchResult[]> {
  const searcher = getFileSearcher(options?.cwd);
  return searcher.searchFiles(query, options);
}

export function clearFileSearchCache(): void {
  if (searcherInstance) {
    searcherInstance.clearCache();
  }
}

export type { FileSearchResult, FileSearchOptions };
