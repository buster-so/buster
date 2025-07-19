import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { AnalystRuntimeContext } from '../../schemas/workflow-schemas';

const readFilesInputSchema = z.object({
  files: z
    .array(z.string())
    .describe(
      'Array of file paths to read. Can be absolute paths (e.g., /path/to/file.txt) or relative paths (e.g., ./relative/path/file.ts). Files will be read with UTF-8 encoding.'
    ),
});

const readFilesOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        file_path: z.string(),
        content: z.string(),
        truncated: z
          .boolean()
          .describe('Whether the file content was truncated due to exceeding 1000 lines'),
      }),
      z.object({
        status: z.literal('error'),
        file_path: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

export function parseStreamingArgs(
  accumulatedText: string
): Partial<z.infer<typeof readFilesInputSchema>> | null {
  if (typeof accumulatedText !== 'string') {
    throw new Error(`parseStreamingArgs expects string input, got ${typeof accumulatedText}`);
  }

  try {
    const parsed = JSON.parse(accumulatedText);
    if (parsed.files !== undefined && !Array.isArray(parsed.files)) {
      console.warn('[read-files parseStreamingArgs] files is not an array:', {
        type: typeof parsed.files,
        value: parsed.files,
      });
      return null;
    }
    return { files: parsed.files || undefined };
  } catch (error) {
    if (error instanceof SyntaxError) {
      const filesMatch = accumulatedText.match(/"files"\s*:\s*\[(.*)/s);
      if (filesMatch && filesMatch[1] !== undefined) {
        const arrayContent = filesMatch[1];
        try {
          const testArray = `[${arrayContent}]`;
          const parsed = JSON.parse(testArray);
          return { files: parsed };
        } catch {
          const files: string[] = [];
          const fileMatches = arrayContent.matchAll(/"((?:[^"\\]|\\.)*)"/g);
          for (const match of fileMatches) {
            if (match[1] !== undefined) {
              const filePath = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              files.push(filePath);
            }
          }
          return { files };
        }
      }
      const partialMatch = accumulatedText.match(/"files"\s*:\s*\[/);
      if (partialMatch) {
        return { files: [] };
      }
      return null;
    }
    throw new Error(
      `Unexpected error in parseStreamingArgs: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

const readFilesExecution = wrapTraced(
  async (
    params: z.infer<typeof readFilesInputSchema>,
    _runtimeContext: RuntimeContext<AnalystRuntimeContext>
  ): Promise<z.infer<typeof readFilesOutputSchema>> => {
    const { files } = params;

    if (!files || files.length === 0) {
      return { results: [] };
    }

    try {
      const { readFilesSafely } = await import('./file-operations');
      const fileResults = readFilesSafely(files);

      return {
        results: fileResults.map((fileResult) => {
          if (fileResult.success) {
            return {
              status: 'success' as const,
              file_path: fileResult.filePath,
              content: fileResult.content || '',
              truncated: fileResult.truncated || false,
            };
          }
          return {
            status: 'error' as const,
            file_path: fileResult.filePath,
            error_message: fileResult.error || 'Unknown error',
          };
        }),
      };
    } catch (error) {
      return {
        results: files.map((filePath) => ({
          status: 'error' as const,
          file_path: filePath,
          error_message: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })),
      };
    }
  },
  { name: 'read-files' }
);

export const readFiles = createTool({
  id: 'read-files',
  description: `Read the contents of one or more files from the filesystem. Accepts both absolute and relative file paths. Files are read with UTF-8 encoding and content is limited to 1000 lines maximum. Returns both successful reads and failures with detailed error messages.`,
  inputSchema: readFilesInputSchema,
  outputSchema: readFilesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof readFilesInputSchema>;
    runtimeContext: RuntimeContext<AnalystRuntimeContext>;
  }) => {
    return await readFilesExecution(context, runtimeContext);
  },
});

export default readFiles;
