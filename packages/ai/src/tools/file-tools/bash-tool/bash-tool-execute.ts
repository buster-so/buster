import { wrapTraced } from 'braintrust';
import type { BashToolContext, BashToolInput, BashToolOutput } from './bash-tool';

const MAX_OUTPUT_LENGTH = 30_000;
const DEFAULT_TIMEOUT = 2 * 60 * 1000; // 2 minutes
const MAX_TIMEOUT = 10 * 60 * 1000; // 10 minutes

/**
 * List of allowed read-only dbt commands
 * These commands only query metadata or generate local artifacts without modifying data
 */
const ALLOWED_DBT_COMMANDS = [
  'compile', // Compiles dbt models to SQL
  'parse', // Parses dbt project and validates
  'list', // Lists resources in dbt project
  'ls', // Alias for list
  'show', // Shows compiled SQL for a model
  'docs', // Generates documentation
  'debug', // Shows dbt debug information
  'deps', // Installs dependencies (read-only in terms of data)
  'clean', // Cleans artifacts (local files only)
];

/**
 * List of blocked dbt write/mutation commands
 * These commands can modify data in the warehouse or create/update resources
 */
const BLOCKED_DBT_COMMANDS = [
  'run', // Executes models (writes data)
  'build', // Builds and tests (writes data)
  'seed', // Loads seed data (writes data)
  'snapshot', // Creates snapshots (writes data)
  'test', // While tests are read-only, they can be expensive and we want to control when they run
  'run-operation', // Runs macros (can write data)
  'retry', // Retries failed runs (writes data)
  'clone', // Clones state (writes metadata)
  'fresh', // Checks freshness (read-only but we block for consistency)
];

/**
 * Validates if a bash command is allowed in research mode (read-only)
 * @param command - The bash command to validate
 * @returns Object with isValid boolean and optional error message
 */
function validateBashCommandForResearchMode(command: string): { isValid: boolean; error?: string } {
  // List of write/destructive operations to block
  const WRITE_PATTERNS = [
    /\brm\s+/, // rm command
    /\bmv\s+/, // mv command
    /\bcp\s+.*\s+/, // cp with destination (allow 'cp file -' to stdout)
    /\bmkdir\s+/, // mkdir command
    /\brmdir\s+/, // rmdir command
    /\btouch\s+/, // touch command
    />/, // output redirect (>, >>)
    /\bsed\s+.*-i/, // sed in-place edit
    /\bawk\s+.*>>/, // awk with output redirect
    /\bgit\s+(commit|push|add|reset|checkout|merge|rebase|cherry-pick|revert)/, // git write operations
    /\b(npm|pnpm|yarn|bun)\s+(install|add|remove|update)/, // package manager write operations
    /\bchmod\s+/, // chmod command
    /\bchown\s+/, // chown command
    /\bddt\s+(run|build|seed|snapshot|test|run-operation)/, // dbt write operations (keeping for backward compat)
  ];

  // Check each pattern
  for (const pattern of WRITE_PATTERNS) {
    if (pattern.test(command)) {
      return {
        isValid: false,
        error: `This command is not allowed in research mode. Research mode only permits read-only operations. Command blocked: ${command.substring(0, 100)}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates if a dbt command is allowed (read-only)
 * @param command - The bash command to validate
 * @returns Object with isValid boolean and optional error message
 */
function validateDbtCommand(command: string): { isValid: boolean; error?: string } {
  // Extract the actual dbt command from the full bash command
  // Handle cases like: "dbt run", "dbt run --select model", "cd path && dbt run"
  const dbtMatch = command.match(/\bdbt\s+([a-z-]+)/);

  if (!dbtMatch || !dbtMatch[1]) {
    // Not a dbt command, allow it
    return { isValid: true };
  }

  const dbtSubcommand = dbtMatch[1];

  // Check if it's a blocked command
  if (BLOCKED_DBT_COMMANDS.includes(dbtSubcommand)) {
    return {
      isValid: false,
      error: `The dbt command '${dbtSubcommand}' is not allowed. This agent can only run read-only dbt commands for querying metadata and generating documentation. Allowed commands: ${ALLOWED_DBT_COMMANDS.join(', ')}`,
    };
  }

  // Check if it's an explicitly allowed command
  if (ALLOWED_DBT_COMMANDS.includes(dbtSubcommand)) {
    return { isValid: true };
  }

  // Unknown dbt command - block it for safety
  return {
    isValid: false,
    error: `The dbt command '${dbtSubcommand}' is not recognized or not allowed. Only read-only dbt commands are permitted: ${ALLOWED_DBT_COMMANDS.join(', ')}`,
  };
}

/**
 * Executes a bash command using Bun.spawn with timeout support
 * @param command - The bash command to execute
 * @param timeout - Timeout in milliseconds
 * @param projectDirectory - The project directory to execute the command in
 * @returns Result object with stdout, stderr, exitCode, and success status
 */
async function executeCommand(
  command: string,
  timeout: number,
  projectDirectory: string
): Promise<BashToolOutput> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Execute command using Bun.spawn
    // Use full path to bash for reliability
    const proc = Bun.spawn(['/bin/bash', '-c', command], {
      cwd: projectDirectory,
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'ignore',
    });

    let stdout = '';
    let stderr = '';

    try {
      // Read stdout and stderr
      const [stdoutText, stderrText] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
      ]);

      stdout = stdoutText;
      stderr = stderrText;

      // Wait for process to exit
      const exitCode = await proc.exited;
      clearTimeout(timeoutId);

      // Truncate output if it exceeds max length
      if (stdout.length > MAX_OUTPUT_LENGTH) {
        stdout = stdout.slice(0, MAX_OUTPUT_LENGTH);
        stdout += '\n\n(Output was truncated due to length limit)';
      }

      if (stderr.length > MAX_OUTPUT_LENGTH) {
        stderr = stderr.slice(0, MAX_OUTPUT_LENGTH);
        stderr += '\n\n(Error output was truncated due to length limit)';
      }

      const success = exitCode === 0;

      const result: BashToolOutput = {
        command,
        stdout,
        stderr,
        exitCode,
        success,
      };

      // Only add error property if there is an error
      if (!success) {
        result.error = stderr || `Command failed with exit code ${exitCode}`;
      }

      return result;
    } catch (readError) {
      clearTimeout(timeoutId);
      proc.kill();

      // Check if it was aborted (timeout)
      if (controller.signal.aborted) {
        return {
          command,
          stdout: '',
          stderr: `Command timed out after ${timeout}ms`,
          exitCode: 124, // Standard timeout exit code
          success: false,
          error: `Command timed out after ${timeout}ms`,
        };
      }

      throw readError;
    }
  } catch (error) {
    // Handle execution errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      command,
      stdout: '',
      stderr: errorMessage,
      exitCode: 1,
      success: false,
      error: `Execution error: ${errorMessage}`,
    };
  }
}

/**
 * Creates the execute function for the bash tool
 * @param context - The tool context containing messageId and project directory
 * @returns The execute function
 */
export function createBashToolExecute(context: BashToolContext) {
  return wrapTraced(
    async function execute(input: BashToolInput): Promise<BashToolOutput> {
      const { messageId, projectDirectory, isInResearchMode, onToolEvent } = context;
      const { command, timeout } = input;

      console.info(`Executing bash command for message ${messageId}: ${command}`);

      // Validate commands in research mode
      if (isInResearchMode) {
        const researchModeValidation = validateBashCommandForResearchMode(command);
        if (!researchModeValidation.isValid) {
          const errorResult: BashToolOutput = {
            command,
            stdout: '',
            stderr: researchModeValidation.error || 'Command validation failed',
            exitCode: 1,
            success: false,
            error: researchModeValidation.error,
          };

          console.error(
            `Command blocked in research mode: ${command}`,
            researchModeValidation.error
          );

          // Emit events for blocked command
          onToolEvent?.({
            tool: 'bashTool',
            event: 'start',
            args: input,
          });

          onToolEvent?.({
            tool: 'bashTool',
            event: 'complete',
            result: errorResult,
            args: input,
          });

          return errorResult;
        }
      }

      // Validate dbt commands before execution (always, regardless of research mode)
      const validation = validateDbtCommand(command);
      if (!validation.isValid) {
        const errorResult: BashToolOutput = {
          command,
          stdout: '',
          stderr: validation.error || 'Command validation failed',
          exitCode: 1,
          success: false,
          error: validation.error,
        };

        console.error(`Command blocked: ${command}`, validation.error);

        // Emit events for blocked command
        onToolEvent?.({
          tool: 'bashTool',
          event: 'start',
          args: input,
        });

        onToolEvent?.({
          tool: 'bashTool',
          event: 'complete',
          result: errorResult,
          args: input,
        });

        return errorResult;
      }

      // Emit start event
      onToolEvent?.({
        tool: 'bashTool',
        event: 'start',
        args: input,
      });

      const commandTimeout = Math.min(timeout ?? DEFAULT_TIMEOUT, MAX_TIMEOUT);
      const result = await executeCommand(command, commandTimeout, projectDirectory);

      // Log result
      if (result.success) {
        console.info(`Command succeeded: ${command}`);
      } else {
        console.error(`Command failed: ${command}`, result.error);
      }

      // Emit complete event
      onToolEvent?.({
        tool: 'bashTool',
        event: 'complete',
        result,
        args: input,
      });

      return result;
    },
    { name: 'bash-execute' }
  );
}
