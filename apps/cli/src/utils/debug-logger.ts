import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Debug logger that writes to a log file instead of stdout/stderr
 * to avoid interfering with Ink UI rendering.
 *
 * Only logs when DEBUG environment variable is set or enableDebugLogging() is called.
 */

let debugEnabled = false;
const LOG_DIR = join(homedir(), '.buster', 'logs');
const LOG_FILE = join(LOG_DIR, 'debug.log');

/**
 * Enable debug logging for the current session
 */
export function enableDebugLogging(): void {
  debugEnabled = true;

  // Ensure log directory exists
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }

  // Write session start marker
  writeToLog('=== Debug session started ===');
}

/**
 * Check if debug logging is enabled
 */
export function isDebugEnabled(): boolean {
  return debugEnabled || process.env.DEBUG === 'true' || process.env.DEBUG === '1';
}

/**
 * Write a message to the debug log file
 */
function writeToLog(message: string): void {
  if (!isDebugEnabled()) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    // Silently fail - we don't want logging errors to break the app
  }
}

/**
 * Format an error for logging
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  return String(error);
}

/**
 * Format any value for logging
 */
function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Debug logger object with methods for different log levels
 */
export const debugLogger = {
  /**
   * Log a debug message
   */
  debug(...args: unknown[]): void {
    const message = args.map(formatValue).join(' ');
    writeToLog(`[DEBUG] ${message}`);
  },

  /**
   * Log an info message
   */
  info(...args: unknown[]): void {
    const message = args.map(formatValue).join(' ');
    writeToLog(`[INFO] ${message}`);
  },

  /**
   * Log a warning message
   */
  warn(...args: unknown[]): void {
    const message = args.map(formatValue).join(' ');
    writeToLog(`[WARN] ${message}`);
  },

  /**
   * Log an error message
   */
  error(...args: unknown[]): void {
    const message = args.map((arg) => {
      if (arg instanceof Error) {
        return formatError(arg);
      }
      return formatValue(arg);
    }).join(' ');
    writeToLog(`[ERROR] ${message}`);
  },

  /**
   * Get the path to the debug log file
   */
  getLogPath(): string {
    return LOG_FILE;
  },
};
