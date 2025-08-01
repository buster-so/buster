import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export interface GrepSearchResult {
  success: boolean;
  path: string;
  pattern: string;
  matches?: Array<{ file: string; lineNumber?: number; content: string }>;
  matchCount?: number;
  error?: string;
}

function executeGrepSearchLocally(search: {
  path: string;
  pattern: string;
  recursive?: boolean;
  ignoreCase?: boolean;
  invertMatch?: boolean;
  lineNumbers?: boolean;
  wordMatch?: boolean;
  fixedStrings?: boolean;
  maxCount?: number;
}): GrepSearchResult {
  try {
    if (!existsSync(search.path)) {
      return {
        success: false,
        path: search.path,
        pattern: search.pattern,
        error: `Path does not exist: ${search.path}`,
      };
    }

    const grepArgs: string[] = [];

    if (search.recursive ?? false) grepArgs.push('-r');
    if (search.ignoreCase ?? false) grepArgs.push('-i');
    if (search.invertMatch ?? false) grepArgs.push('-v');
    if (search.lineNumbers ?? true) grepArgs.push('-n');
    if (search.wordMatch ?? false) grepArgs.push('-w');
    if (search.fixedStrings ?? false) grepArgs.push('-F');
    if (search.maxCount) grepArgs.push('-m', search.maxCount.toString());

    grepArgs.push(search.pattern);
    grepArgs.push(search.path);

    const output = execSync(
      `grep ${grepArgs.map((arg) => `"${arg.replace(/"/g, '\\"')}"`).join(' ')}`,
      {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10,
        timeout: 30000,
      }
    );

    const lines = output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);
    const matches: Array<{ file: string; lineNumber?: number; content: string }> = [];

    for (const line of lines) {
      if (search.lineNumbers ?? true) {
        // When not in recursive mode, grep outputs: linenumber:content
        // When in recursive mode, grep outputs: filename:linenumber:content
        if (search.recursive) {
          const match = line.match(/^([^:]+):(\d+):(.*)$/);
          if (match?.[1] && match[2] && match[3] !== undefined) {
            matches.push({
              file: match[1],
              lineNumber: Number.parseInt(match[2], 10),
              content: match[3],
            });
          } else {
            matches.push({
              file: search.path,
              content: line,
            });
          }
        } else {
          // For single file search with line numbers: linenumber:content
          const match = line.match(/^(\d+):(.*)$/);
          if (match?.[1] && match[2] !== undefined) {
            matches.push({
              file: search.path,
              lineNumber: Number.parseInt(match[1], 10),
              content: match[2],
            });
          } else {
            matches.push({
              file: search.path,
              content: line,
            });
          }
        }
      } else {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0 && search.recursive) {
          matches.push({
            file: line.substring(0, colonIndex),
            content: line.substring(colonIndex + 1),
          });
        } else {
          matches.push({
            file: search.path,
            content: line,
          });
        }
      }
    }

    return {
      success: true,
      path: search.path,
      pattern: search.pattern,
      matches,
      matchCount: matches.length,
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 1) {
      return {
        success: true,
        path: search.path,
        pattern: search.pattern,
        matches: [],
        matchCount: 0,
      };
    }
    return {
      success: false,
      path: search.path,
      pattern: search.pattern,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function executeGrepSearchesLocally(
  searches: Array<{
    path: string;
    pattern: string;
    recursive?: boolean;
    ignoreCase?: boolean;
    invertMatch?: boolean;
    lineNumbers?: boolean;
    wordMatch?: boolean;
    fixedStrings?: boolean;
    maxCount?: number;
  }>
): Promise<{
  successful_searches: Array<{
    path: string;
    pattern: string;
    matches: Array<{ file: string; lineNumber?: number; content: string }>;
    matchCount: number;
  }>;
  failed_searches: Array<{
    path: string;
    pattern: string;
    error: string;
  }>;
}> {
  const successfulSearches: Array<{
    path: string;
    pattern: string;
    matches: Array<{ file: string; lineNumber?: number; content: string }>;
    matchCount: number;
  }> = [];
  const failedSearches: Array<{
    path: string;
    pattern: string;
    error: string;
  }> = [];

  const results = await Promise.allSettled(
    searches.map(async (search) => {
      try {
        const result = executeGrepSearchLocally(search);

        if (result.success) {
          return {
            type: 'success' as const,
            data: {
              path: result.path,
              pattern: result.pattern,
              matches: result.matches || [],
              matchCount: result.matchCount || 0,
            },
          };
        }
        return {
          type: 'failure' as const,
          data: {
            path: result.path,
            pattern: result.pattern,
            error: result.error || 'Unknown error occurred',
          },
        };
      } catch (error) {
        return {
          type: 'failure' as const,
          data: {
            path: search.path,
            pattern: search.pattern,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        };
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.type === 'success') {
        successfulSearches.push(result.value.data);
      } else {
        failedSearches.push(result.value.data);
      }
    } else {
      failedSearches.push({
        path: 'unknown',
        pattern: 'unknown',
        error: result.reason?.message || 'Promise rejected',
      });
    }
  }

  return {
    successful_searches: successfulSearches,
    failed_searches: failedSearches,
  };
}

export function generateGrepSearchCode(
  searches: Array<{
    path: string;
    pattern: string;
    recursive?: boolean;
    ignoreCase?: boolean;
    invertMatch?: boolean;
    lineNumbers?: boolean;
    wordMatch?: boolean;
    fixedStrings?: boolean;
    maxCount?: number;
  }>
): string {
  return `
const { execSync } = require('child_process');
const fs = require('fs');

function executeGrepSearch(search) {
  try {
    if (!fs.existsSync(search.path)) {
      return {
        success: false,
        path: search.path,
        pattern: search.pattern,
        error: \`Path does not exist: \${search.path}\`,
      };
    }

    const grepArgs = [];

    if (search.recursive ?? false) grepArgs.push('-r');
    if (search.ignoreCase ?? false) grepArgs.push('-i');
    if (search.invertMatch ?? false) grepArgs.push('-v');
    if (search.lineNumbers ?? true) grepArgs.push('-n');
    if (search.wordMatch ?? false) grepArgs.push('-w');
    if (search.fixedStrings ?? false) grepArgs.push('-F');
    if (search.maxCount) grepArgs.push('-m', search.maxCount.toString());

    grepArgs.push(search.pattern);
    grepArgs.push(search.path);

    const output = execSync(
      \`grep \${grepArgs.map((arg) => \`"\${arg.replace(/"/g, '\\\\"')}"\`).join(' ')}\`,
      {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10,
        timeout: 30000,
      }
    );

    const lines = output
      .trim()
      .split('\\n')
      .filter((line) => line.length > 0);
    const matches = [];

    for (const line of lines) {
      if (search.lineNumbers ?? true) {
        // When not in recursive mode, grep outputs: linenumber:content
        // When in recursive mode, grep outputs: filename:linenumber:content
        if (search.recursive) {
          const match = line.match(/^([^:]+):(\\d+):(.*)$/);
          if (match && match[1] && match[2] && match[3] !== undefined) {
            matches.push({
              file: match[1],
              lineNumber: parseInt(match[2], 10),
              content: match[3],
            });
          } else {
            matches.push({
              file: search.path,
              content: line,
            });
          }
        } else {
          // For single file search with line numbers: linenumber:content
          const match = line.match(/^(\\d+):(.*)$/);
          if (match && match[1] && match[2] !== undefined) {
            matches.push({
              file: search.path,
              lineNumber: parseInt(match[1], 10),
              content: match[2],
            });
          } else {
            matches.push({
              file: search.path,
              content: line,
            });
          }
        }
      } else {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0 && search.recursive) {
          matches.push({
            file: line.substring(0, colonIndex),
            content: line.substring(colonIndex + 1),
          });
        } else {
          matches.push({
            file: search.path,
            content: line,
          });
        }
      }
    }

    return {
      success: true,
      path: search.path,
      pattern: search.pattern,
      matches,
      matchCount: matches.length,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 1) {
      return {
        success: true,
        path: search.path,
        pattern: search.pattern,
        matches: [],
        matchCount: 0,
      };
    }
    return {
      success: false,
      path: search.path,
      pattern: search.pattern,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

const searches = ${JSON.stringify(searches)};
const results = searches.map(search => executeGrepSearch(search));
console.log(JSON.stringify(results));
  `.trim();
}
