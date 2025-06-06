import { spawn } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';

interface BashToolParams {
  command: string;
  timeout?: number;
  workingDir?: string;
  captureOutput?: boolean;
  env?: Record<string, string>;
}

interface BashToolResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
  duration: number;
  command: string;
}

export const bashTool = createTool({
  id: 'bash-execute',
  description: 'Execute bash commands with security restrictions and timeout support',
  inputSchema: z.object({
    command: z.string().describe('Bash command to execute'),
    timeout: z.number().default(30000).describe('Timeout in milliseconds (default: 30000)'),
    workingDir: z.string().optional().describe('Working directory for command execution'),
    captureOutput: z.boolean().default(true).describe('Whether to capture command output'),
    env: z.record(z.string()).optional().describe('Environment variables to set'),
  }),
  outputSchema: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number(),
    success: z.boolean(),
    duration: z.number(),
    command: z.string(),
  }),
  execute: async ({ context }) => {
    return await executeBashCommand(context as BashToolParams);
  },
});

const executeBashCommand = wrapTraced(
  async (params: BashToolParams): Promise<BashToolResult> => {
    const { command, timeout = 30000, workingDir, captureOutput = true, env } = params;

    // Security validation
    validateCommand(command);

    // Validate working directory if provided
    let resolvedWorkingDir: string | undefined;
    if (workingDir) {
      validateWorkingDirectory(workingDir);
      resolvedWorkingDir = resolve(workingDir);
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Combine environment variables
      const processEnv = {
        ...process.env,
        ...env,
        // Security: Remove sensitive variables
        PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
        HOME: process.env.HOME || '/tmp',
      };

      // Remove potentially dangerous env vars
      delete (processEnv as any).SUDO_USER;
      delete (processEnv as any).SUDO_COMMAND;

      const childProcess = spawn('bash', ['-c', command], {
        cwd: resolvedWorkingDir || process.cwd(),
        timeout,
        stdio: captureOutput ? 'pipe' : 'inherit',
        env: processEnv,
        shell: false, // Use bash directly, not shell
      });

      let stdout = '';
      let stderr = '';

      if (captureOutput) {
        childProcess.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        childProcess.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      childProcess.on('close', (code) => {
        const duration = Date.now() - startTime;

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          success: code === 0,
          duration,
          command,
        });
      });

      childProcess.on('error', (error) => {
        const duration = Date.now() - startTime;

        if (error.message.includes('ETIMEDOUT')) {
          resolve({
            stdout: '',
            stderr: `Command timed out after ${timeout}ms`,
            exitCode: 124, // Standard timeout exit code
            success: false,
            duration,
            command,
          });
        } else {
          reject(new Error(`Command execution failed: ${error.message}`));
        }
      });

      // Handle timeout manually for better control
      const timeoutId = setTimeout(() => {
        childProcess.kill('SIGTERM');
        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000); // Give 5s for graceful shutdown
      }, timeout);

      childProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  },
  { name: 'bash-execute' }
);

function validateCommand(command: string): void {
  if (!command || command.trim() === '') {
    throw new Error('Command cannot be empty');
  }

  // Check for dangerous commands
  const dangerousCommands = [
    'rm -rf /',
    'dd if=',
    'mkfs',
    'fdisk',
    'parted',
    'mount',
    'umount',
    'chown',
    'chmod 777',
    'passwd',
    'su -',
    'sudo su',
    'userdel',
    'useradd',
    'deluser',
    'adduser',
    'shutdown',
    'reboot',
    'init ',
    'systemctl',
    'service',
    'killall',
    'pkill -9',
    'kill -9',
    'iptables',
    'ufw ',
    'firewall',
    'crontab',
    'at ',
    'nohup',
    '> /dev/',
    '< /dev/',
    '/dev/zero',
    '/dev/null > ',
    'exec(',
  ];

  const normalizedCommand = command.toLowerCase().replace(/\s+/g, ' ');

  for (const dangerous of dangerousCommands) {
    if (normalizedCommand.includes(dangerous.toLowerCase())) {
      throw new Error(`Dangerous command detected: ${dangerous}`);
    }
  }

  // Check for command injection patterns
  const injectionPatterns = [
    /;[\s]*rm/,
    /\|[\s]*rm/,
    /&&[\s]*rm/,
    /\$\(/,
    /`[^`]*`/,
    /\$\{[^}]*\}/,
    />\s*\/etc\//,
    />\s*\/bin\//,
    />\s*\/usr\//,
    />\s*\/sbin\//,
    />\s*\/root\//,
    /curl.*\|.*sh/,
    /wget.*\|.*sh/,
    /bash.*<.*\(/,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(command)) {
      throw new Error('Potentially dangerous command pattern detected');
    }
  }

  // Validate command length
  if (command.length > 2000) {
    throw new Error('Command too long (max 2000 characters)');
  }
}

function validateWorkingDirectory(workingDir: string): void {
  // Ensure path is absolute
  if (!isAbsolute(workingDir)) {
    throw new Error(`Working directory must be absolute: ${workingDir}`);
  }

  // Ensure path doesn't contain traversal attempts
  if (workingDir.includes('..') || workingDir.includes('~')) {
    throw new Error(`Path traversal not allowed: ${workingDir}`);
  }

  // Block access to sensitive system directories
  const blockedPaths = [
    '/etc/',
    '/var/log/',
    '/root/',
    '/proc/',
    '/sys/',
    '/dev/',
    '/boot/',
    '/bin/',
    '/sbin/',
    '/usr/bin/',
    '/usr/sbin/',
  ];

  // Add user-specific sensitive paths if HOME is available
  if (process.env.HOME) {
    blockedPaths.push(
      `${process.env.HOME}/.ssh/`,
      `${process.env.HOME}/.aws/`,
      `${process.env.HOME}/.config/`
    );
  }

  const resolvedPath = resolve(workingDir);

  for (const blocked of blockedPaths) {
    if (resolvedPath.startsWith(blocked)) {
      throw new Error(`Access denied to path: ${resolvedPath}`);
    }
  }
}

// Helper function for other tools to use
export async function executeCommand(
  command: string,
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<BashToolResult> {
  return await executeBashCommand({
    command,
    workingDir: options.cwd,
    env: options.env,
    timeout: options.timeout,
    captureOutput: true,
  });
}
