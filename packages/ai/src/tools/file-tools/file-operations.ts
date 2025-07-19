import * as fs from 'node:fs';
import * as path from 'node:path';

export interface FileReadResult {
  success: boolean;
  filePath: string;
  content?: string;
  error?: string;
  truncated?: boolean;
}

export function readFilesSafely(filePaths: string[]): FileReadResult[] {
  const results: FileReadResult[] = [];

  for (const filePath of filePaths) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(resolvedPath)) {
        results.push({
          success: false,
          filePath,
          error: 'File not found',
        });
        continue;
      }

      const content = fs.readFileSync(resolvedPath, 'utf-8');
      const lines = content.split('\n');

      if (lines.length > 1000) {
        const truncatedContent = lines.slice(0, 1000).join('\n');
        results.push({
          success: true,
          filePath,
          content: truncatedContent,
          truncated: true,
        });
      } else {
        results.push({
          success: true,
          filePath,
          content,
          truncated: false,
        });
      }
    } catch (error) {
      results.push({
        success: false,
        filePath,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }

  return results;
}
