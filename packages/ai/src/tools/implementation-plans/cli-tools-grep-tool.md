# Grep Tool Implementation Plan

## Overview

Migrate the Rust `grep_tool.rs` to TypeScript using Mastra framework. This tool searches file contents using regular expressions with ripgrep integration.

## Current Rust Implementation Analysis

- **File**: `api/libs/agents/src/tools/categories/cli_tools/grep_tool.rs`
- **Purpose**: Search file contents with regex patterns
- **Input**: Search pattern, path, options
- **Output**: Matching files and line content
- **Key Features**:
  - Regex pattern matching
  - Line context (before/after)
  - File type filtering
  - Case sensitivity options
  - Performance via ripgrep

## Dependencies
- Node.js child_process for ripgrep execution
- Node.js fs/promises for fallback implementation
- Node.js path module
- Security validation utilities
- glob library for file discovery
- @mastra/core for tool framework
- Braintrust for tracing

## Implementation Pattern
**Type**: Function-based
**Wave**: 1
**AI Agent Time**: 3 minutes
**Depends on**: None (foundational tool)

## TypeScript Implementation

### Tool Definition

```typescript
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
    exclude: z.array(z.string()).default(['**/node_modules/**', '**/.git/**']),
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
    return await grepSearch(context);
  },
});
```

### Core Implementation

```typescript
import { spawn } from 'child_process';
import { resolve } from 'path';

const grepSearch = wrapTraced(
  async (params: GrepParams) => {
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
    args.push(resolve(path));
    
    // Execute ripgrep
    const results = await executeRipgrep(args);
    
    return parseRipgrepOutput(results, pattern);
  },
  { name: 'grep-search' }
);

async function executeRipgrep(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const rg = spawn('rg', args, {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    let stdout = '';
    let stderr = '';
    
    rg.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    rg.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    rg.on('close', (code) => {
      if (code === 0 || code === 1) { // 1 = no matches found
        resolve(stdout);
      } else {
        reject(new Error(`ripgrep failed: ${stderr}`));
      }
    });
    
    rg.on('error', (error) => {
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
  const { pattern, path, regex, case_sensitive } = params;
  
  // Get all files
  const files = await glob('**/*', {
    cwd: path,
    ignore: params.exclude,
    nodir: true
  });
  
  const matches: Match[] = [];
  let filesWithMatches = 0;
  
  // Create regex
  const flags = case_sensitive ? 'g' : 'gi';
  const searchRegex = regex ? new RegExp(pattern, flags) : 
    new RegExp(escapeRegExp(pattern), flags);
  
  for (const file of files) {
    const content = await readFile(resolve(path, file), 'utf8');
    const lines = content.split('\n');
    let fileHasMatch = false;
    
    lines.forEach((line, index) => {
      if (searchRegex.test(line)) {
        fileHasMatch = true;
        matches.push({
          file,
          line_number: index + 1,
          line_content: line,
          match_content: line.match(searchRegex)?.[0] || '',
          context_before: [],
          context_after: []
        });
      }
    });
    
    if (fileHasMatch) filesWithMatches++;
  }
  
  return {
    pattern,
    total_matches: matches.length,
    files_searched: files.length,
    files_with_matches: filesWithMatches,
    matches
  };
}
```

## Test Strategy

### Unit Tests (`grep-tool.unit.test.ts`)
- Input validation and schema compliance
- Core business logic testing
- Error handling scenarios
- Mock dependency testing
- Pattern matching logic
- Regex vs literal search
- Context line extraction
- Fallback implementation

### Integration Tests (`grep-tool.integration.test.ts`)
- Real filesystem integration
- End-to-end workflow testing
- Performance and concurrent execution
- Security validation
- Cross-tool integration scenarios
- Ripgrep integration testing
- File filtering capabilities

## AI Agent Implementation Time

**Estimated Time**: 3 minutes
**Complexity**: Medium

## Implementation Priority

**High** - Essential for code search and analysis.