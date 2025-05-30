import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { spawn } from 'node:child_process';
import { resolve, isAbsolute } from 'node:path';
import { readFile } from 'node:fs/promises';
import { glob } from 'glob';

interface GrepParams {
  pattern: string;
  path?: string;
  regex?: boolean;
  case_sensitive?: boolean;
  whole_word?: boolean;
  include?: string[];
  exclude?: string[];
  max_count?: number;
  context_lines?: number;
  multiline?: boolean;
}

interface Match {
  file: string;
  line_number: number;
  line_content: string;
  match_content: string;
  context_before: string[];
  context_after: string[];
}

interface GrepResult {
  pattern: string;
  total_matches: number;
  files_searched: number;
  files_with_matches: number;
  matches: Match[];
}

export const grepTool = createTool({
  id: 'grep-search',
  description: 'Search file contents using regular expressions with ripgrep',
  inputSchema: z.object({
    pattern: z.string().describe('Search pattern (regex or literal)'),
    path: z.string().default('.').describe('Path to search in'),
    regex: z.boolean().default(false).describe('Treat pattern as regex'),
    case_sensitive: z.boolean().default(true).describe('Case sensitive search'),
    whole_word: z.boolean().default(false).describe('Match whole words only'),
    include: z.array(z.string()).optional().describe('File patterns to include'),
    exclude: z.array(z.string()).default(['**/node_modules/**', '**/.git/**'])
      .describe('File patterns to exclude'),
    max_count: z.number().optional().describe('Max matches per file'),
    context_lines: z.number().default(0).describe('Lines of context'),
    multiline: z.boolean().default(false).describe('Enable multiline matching')
  }),
  outputSchema: z.object({
    pattern: z.string(),
    total_matches: z.number(),
    files_searched: z.number(),
    files_with_matches: z.number(),
    matches: z.array(z.object({
      file: z.string(),
      line_number: z.number(),
      line_content: z.string(),
      match_content: z.string(),
      context_before: z.array(z.string()),
      context_after: z.array(z.string())
    }))
  }),
  execute: async ({ context }) => {
    return await grepSearch(context as GrepParams);
  },
});

const grepSearch = wrapTraced(
  async (params: GrepParams): Promise<GrepResult> => {
    const {
      pattern,
      path = '.'
    } = params;
    
    // Validate pattern
    if (!pattern || pattern.trim() === '') {
      throw new Error('Pattern cannot be empty');
    }
    
    // Resolve and validate path
    const searchPath = resolve(path);
    validateReadPath(searchPath);
    
    try {
      // Try ripgrep first
      return await ripgrepSearch(params);
    } catch (error) {
      // Fall back to pure Node.js implementation
      console.warn('Ripgrep not available, falling back to Node.js implementation:', error instanceof Error ? error.message : String(error));
      return await fallbackGrep(params);
    }
  },
  { name: 'grep-search' }
);

async function ripgrepSearch(params: GrepParams): Promise<GrepResult> {
  const {
    pattern,
    path = '.',
    regex = false,
    case_sensitive = true,
    whole_word = false,
    include,
    exclude = ['**/node_modules/**', '**/.git/**'],
    max_count,
    context_lines = 0,
    multiline = false
  } = params;

  const searchPath = resolve(path);
  
  // Build ripgrep command
  const args: string[] = [];
  
  // Pattern (escape if not regex)
  if (!regex) {
    args.push('--fixed-strings');
  }
  args.push(pattern);
  
  // Options
  if (!case_sensitive) args.push('--ignore-case');
  if (whole_word) args.push('--word-regexp');
  if (context_lines > 0) {
    args.push('--context', String(context_lines));
  }
  if (max_count) {
    args.push('--max-count', String(max_count));
  }
  if (multiline) args.push('--multiline');
  
  // File filters
  if (include && include.length > 0) {
    include.forEach(glob => {
      args.push('--glob', glob);
    });
  }
  
  exclude.forEach(glob => {
    args.push('--glob', `!${glob}`);
  });
  
  // Output format
  args.push('--json');
  
  // Path
  args.push(searchPath);
  
  // Execute ripgrep
  const results = await executeRipgrep(args);
  
  return parseRipgrepOutput(results, pattern);
}

async function executeRipgrep(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const rg = spawn('rg', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    rg.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    rg.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    
    rg.on('close', (code: number | null) => {
      if (code === 0 || code === 1) { // 1 = no matches found
        resolve(stdout);
      } else {
        reject(new Error(`ripgrep failed: ${stderr}`));
      }
    });
    
    rg.on('error', (error: Error) => {
      if (error.message.includes('ENOENT')) {
        reject(new Error('ripgrep not found. Please install ripgrep.'));
      } else {
        reject(error);
      }
    });
  });
}

function parseRipgrepOutput(output: string, pattern: string): GrepResult {
  const lines = output.trim().split('\n').filter(Boolean);
  const matches: Match[] = [];
  const filesWithMatches = new Set<string>();
  let filesSearched = 0;
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      
      switch (data.type) {
        case 'match':
          filesWithMatches.add(data.data.path.text);
          
          const match: Match = {
            file: data.data.path.text,
            line_number: data.data.line_number,
            line_content: data.data.lines.text,
            match_content: data.data.submatches[0]?.match.text || '',
            context_before: [],
            context_after: []
          };
          
          // Extract context if available
          if (data.data.context_before) {
            match.context_before = data.data.context_before.map((c: any) => c.text);
          }
          if (data.data.context_after) {
            match.context_after = data.data.context_after.map((c: any) => c.text);
          }
          
          matches.push(match);
          break;
          
        case 'summary':
          filesSearched = data.data.stats.searches_with_match + 
                          data.data.stats.searches_without_match;
          break;
      }
    } catch (e) {
      // Skip invalid JSON lines
    }
  }
  
  return {
    pattern,
    total_matches: matches.length,
    files_searched: filesSearched || filesWithMatches.size,
    files_with_matches: filesWithMatches.size,
    matches
  };
}

// Fallback implementation without ripgrep
async function fallbackGrep(params: GrepParams): Promise<GrepResult> {
  const { 
    pattern, 
    path = '.', 
    regex = false, 
    case_sensitive = true,
    whole_word = false,
    include,
    exclude = ['**/node_modules/**', '**/.git/**'],
    max_count,
    context_lines = 0
  } = params;
  
  const searchPath = resolve(path);
  validateReadPath(searchPath);
  
  // Get all files using glob
  let globPattern = '**/*';
  if (include && include.length > 0) {
    globPattern = include.length === 1 ? include[0]! : `{${include.join(',')}}`;
  }
  
  const files = await glob(globPattern, {
    cwd: searchPath,
    ignore: exclude,
    nodir: true,
    dot: true
  });
  
  const matches: Match[] = [];
  let filesWithMatches = 0;
  
  // Create regex
  let flags = 'g';
  if (!case_sensitive) flags += 'i';
  let regexPattern: string;
  if (regex && !whole_word) {
    // Use pattern as-is for regex
    regexPattern = pattern;
  } else if (whole_word) {
    regexPattern = `\\b${escapeRegExp(pattern)}\\b`;
  } else {
    // Escape for literal search
    regexPattern = escapeRegExp(pattern);
  }
  
  const searchRegex = new RegExp(regexPattern, flags);
  
  for (const file of files) {
    try {
      const fullPath = resolve(searchPath, file);
      const content = await readFile(fullPath, 'utf8');
      const lines = content.split('\n');
      let fileHasMatch = false;
      let fileMatchCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const matches_in_line = line.match(searchRegex);
        
        if (matches_in_line) {
          if (max_count && fileMatchCount >= max_count) {
            break;
          }
          
          fileHasMatch = true;
          fileMatchCount++;
          
          // Get context
          const contextBefore: string[] = [];
          const contextAfter: string[] = [];
          
          if (context_lines > 0) {
            for (let j = Math.max(0, i - context_lines); j < i; j++) {
              const contextLine = lines[j];
              if (contextLine !== undefined) {
                contextBefore.push(contextLine);
              }
            }
            for (let j = i + 1; j <= Math.min(lines.length - 1, i + context_lines); j++) {
              const contextLine = lines[j];
              if (contextLine !== undefined) {
                contextAfter.push(contextLine);
              }
            }
          }
          
          matches.push({
            file,
            line_number: i + 1,
            line_content: line,
            match_content: matches_in_line[0] || '',
            context_before: contextBefore,
            context_after: contextAfter
          });
        }
      }
      
      if (fileHasMatch) filesWithMatches++;
    } catch (error) {
      // Skip files that can't be read
      console.warn(`Could not read file ${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  return {
    pattern,
    total_matches: matches.length,
    files_searched: files.length,
    files_with_matches: filesWithMatches,
    matches
  };
}

function validateReadPath(path: string): void {
  // Ensure path is absolute
  if (!isAbsolute(path)) {
    throw new Error(`Path must be absolute: ${path}`);
  }

  // Ensure path doesn't contain traversal attempts before resolving
  if (path.includes('..') || path.includes('~')) {
    throw new Error(`Path traversal not allowed: ${path}`);
  }

  // Resolve to absolute path and check for sensitive directories
  const resolvedPath = resolve(path);

  // Block access to sensitive system directories
  const blockedPaths = [
    '/etc/',
    '/var/log/',
    '/root/',
    '/home/',
    '/proc/',
    '/sys/',
  ];

  // Add user-specific sensitive paths if HOME is available
  if (process.env.HOME) {
    blockedPaths.push(
      `${process.env.HOME}/.ssh/`,
      `${process.env.HOME}/.aws/`
    );
  }

  for (const blocked of blockedPaths) {
    if (resolvedPath.startsWith(blocked)) {
      throw new Error(`Access denied to path: ${resolvedPath}`);
    }
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}