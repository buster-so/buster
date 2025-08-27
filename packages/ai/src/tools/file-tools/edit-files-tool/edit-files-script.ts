import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface FileEdit {
  filePath: string;
  findString: string;
  replaceString: string;
}

interface FileEditResult {
  success: boolean;
  filePath: string;
  message?: string;
  error?: string;
}

async function editFiles(edits: FileEdit[]): Promise<FileEditResult[]> {
  const results: FileEditResult[] = [];

  // Process files sequentially to avoid race conditions
  for (const { filePath, findString, replaceString } of edits) {
    try {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      try {
        await fs.access(resolvedPath);
      } catch (_accessError) {
        const errorMsg = 'File not found';
        console.error(`Error accessing file ${filePath}: ${errorMsg}`);
        results.push({
          success: false,
          filePath,
          error: errorMsg,
        });
        continue;
      }

      const content = await fs.readFile(resolvedPath, 'utf-8');

      const escapedFindString = findString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const occurrences = (content.match(new RegExp(escapedFindString, 'g')) || []).length;

      if (occurrences === 0) {
        const errorMsg = `Find string not found in file: "${findString}"`;
        console.error(`Error in ${filePath}: ${errorMsg}`);
        results.push({
          success: false,
          filePath,
          error: errorMsg,
        });
        continue;
      }

      if (occurrences > 1) {
        const errorMsg = `Find string appears ${occurrences} times in file. Please use a more specific string that appears exactly once: "${findString}"`;
        console.error(`Error in ${filePath}: ${errorMsg}`);
        results.push({
          success: false,
          filePath,
          error: errorMsg,
        });
        continue;
      }

      const updatedContent = content.replace(new RegExp(escapedFindString, 'g'), replaceString);
      await fs.writeFile(resolvedPath, updatedContent, 'utf-8');

      results.push({
        success: true,
        filePath,
        message: `Successfully replaced "${findString}" with "${replaceString}" in ${filePath}`,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error processing ${filePath}: ${errorMsg}`);
      results.push({
        success: false,
        filePath,
        error: errorMsg,
      });
    }
  }

  return results;
}

// Script execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const errorMsg = 'No arguments provided to script';
    console.error(errorMsg);
    console.log(
      JSON.stringify([
        {
          success: false,
          filePath: '',
          error: errorMsg,
        },
      ])
    );
    process.exit(1);
  }

  let edits: FileEdit[];
  try {
    // The first argument should be a JSON string containing the edits array (possibly base64 encoded)
    let editsJson = args[0];
    if (!editsJson) {
      throw new Error('No argument provided');
    }

    // Try to decode from base64 if it looks like base64
    if (editsJson && /^[A-Za-z0-9+/]+=*$/.test(editsJson) && editsJson.length % 4 === 0) {
      try {
        editsJson = Buffer.from(editsJson, 'base64').toString('utf-8');
      } catch {
        // If base64 decode fails, use as-is
      }
    }

    edits = JSON.parse(editsJson);

    if (!Array.isArray(edits)) {
      throw new Error('Input must be an array of edits');
    }

    // Validate each edit has required fields
    for (const edit of edits) {
      if (!edit.filePath || !edit.findString || edit.replaceString === undefined) {
        throw new Error('Each edit must have filePath, findString, and replaceString properties');
      }
    }
  } catch (error) {
    // Return error information instead of empty array
    const errorMsg = `Failed to parse arguments: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    console.log(
      JSON.stringify([
        {
          success: false,
          filePath: '',
          error: errorMsg,
        },
      ])
    );
    process.exit(1);
  }

  const results = await editFiles(edits);

  // Check if any edits failed
  const hasFailures = results.some((r) => !r.success);

  // Output as JSON to stdout
  console.log(JSON.stringify(results));

  // Exit with error code if any edits failed
  if (hasFailures) {
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  // Return error information for unexpected errors
  const errorMsg = `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  console.error(errorMsg);
  console.log(
    JSON.stringify([
      {
        success: false,
        filePath: '',
        error: errorMsg,
      },
    ])
  );
  process.exit(1);
});
