import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { chmod, mkdir, readFile, rename, rm, unlink } from 'node:fs/promises';
import { arch, platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import chalk from 'chalk';
import { checkForUpdate, formatVersion } from '../../utils/version/index';
import { isInstalledViaHomebrew } from './homebrew-detection';
import {
  type BinaryInfo,
  type UpdateOptions,
  UpdateOptionsSchema,
  type UpdateResult,
} from './update-schemas';

const GITHUB_RELEASES_URL = 'https://github.com/buster-so/buster/releases/download';

/**
 * Get the current CLI version from package.json
 */
export function getCurrentVersion(): string {
  // This will be replaced with the actual version during build
  return '0.3.1';
}

/**
 * Determine the binary file name based on platform
 */
export function getBinaryFileName(): string {
  const os = platform();
  const cpuArch = arch();

  if (os === 'darwin') {
    if (cpuArch === 'arm64') {
      return 'buster-cli-darwin-arm64.tar.gz';
    }
    return 'buster-cli-darwin-x86_64.tar.gz';
  } else if (os === 'linux') {
    return 'buster-cli-linux-x86_64.tar.gz';
  } else if (os === 'win32') {
    return 'buster-cli-windows-x86_64.zip';
  }

  throw new Error(`Unsupported platform: ${os} ${cpuArch}`);
}

/**
 * Get download URLs for the binary
 */
export function getBinaryInfo(version: string): BinaryInfo {
  const fileName = getBinaryFileName();
  const versionTag = version.startsWith('v') ? version : `v${version}`;

  return {
    fileName,
    downloadUrl: `${GITHUB_RELEASES_URL}/${versionTag}/${fileName}`,
    checksumUrl: `${GITHUB_RELEASES_URL}/${versionTag}/${fileName}.sha256`,
  };
}

/**
 * Download a file from a URL
 */
async function downloadFile(url: string, destination: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download from ${url}: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  // Create write stream
  const fileStream = createWriteStream(destination);

  // Use Web Streams API with Node.js streams
  const reader = response.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Write chunk to file
      await new Promise<void>((resolve, reject) => {
        fileStream.write(value, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  } finally {
    fileStream.end();
  }
}

/**
 * Verify file checksum
 */
async function verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
  const hash = createHash('sha256');
  const stream = createReadStream(filePath);

  await pipeline(stream, hash);

  const actualChecksum = hash.digest('hex');
  return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
}

/**
 * Extract archive based on platform
 */
async function extractArchive(archivePath: string, destination: string): Promise<string> {
  const os = platform();

  if (os === 'win32') {
    // Use PowerShell for Windows with spawn to avoid shell injection
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        'powershell',
        [
          '-Command',
          'Expand-Archive',
          '-Path',
          archivePath,
          '-DestinationPath',
          destination,
          '-Force',
        ],
        { stdio: 'ignore' }
      );

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PowerShell exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
    return join(destination, 'buster.exe');
  } else {
    // Use tar for Unix-like systems with spawn to avoid shell injection
    await new Promise<void>((resolve, reject) => {
      const child = spawn('tar', ['-xzf', archivePath, '-C', destination], {
        stdio: 'ignore',
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar exited with code ${code}`));
        }
      });

      child.on('error', (err) => {
        reject(err);
      });
    });
    return join(destination, 'buster');
  }
}

/**
 * Check if the CLI is running as a standalone binary
 */
function isBinaryExecution(): boolean {
  // Check if running via node/npm/pnpm/yarn/bun
  const execPath = process.execPath.toLowerCase();
  const argv0 = process.argv[0]?.toLowerCase() || '';

  // Common indicators of non-binary execution
  const nonBinaryIndicators = ['node', 'npm', 'pnpm', 'yarn', 'bun', 'tsx', 'ts-node'];

  return !nonBinaryIndicators.some(
    (indicator) => execPath.includes(indicator) || argv0.includes(indicator)
  );
}

/**
 * Replace the current binary with the new one
 */
async function replaceBinary(newBinaryPath: string): Promise<void> {
  const currentBinary = process.execPath;
  const backupPath = `${currentBinary}.backup`;

  try {
    // Create backup of current binary
    await rename(currentBinary, backupPath);

    // Move new binary to current location
    await rename(newBinaryPath, currentBinary);

    // Make executable (Unix only)
    if (platform() !== 'win32') {
      await chmod(currentBinary, 0o755);
    }

    // Remove backup
    await unlink(backupPath);
  } catch (error) {
    // Try to restore backup if something went wrong
    if (existsSync(backupPath)) {
      try {
        await rename(backupPath, currentBinary);
      } catch {
        // Backup restore failed
      }
    }
    throw error;
  }
}

/**
 * Main update handler function
 */
export async function updateHandler(options: UpdateOptions): Promise<UpdateResult> {
  const validated = UpdateOptionsSchema.parse(options);
  const currentVersion = getCurrentVersion();

  // Check if installed via Homebrew
  const isHomebrew = isInstalledViaHomebrew();

  // If just checking for updates, always proceed regardless of installation method
  if (isHomebrew && !validated.check && !validated.force) {
    return {
      success: false,
      message: `Buster was installed via Homebrew. Please use:\n\n  ${chalk.cyan('brew upgrade buster')}\n\nto update to the latest version.`,
      currentVersion,
      isHomebrew: true,
    };
  }

  // Check if running as a binary (not via node/npm/etc)
  if (!isBinaryExecution() && !validated.check && !validated.force) {
    return {
      success: false,
      message: `Auto-update only works with standalone binary installations.\n\nYou appear to be running Buster via ${chalk.yellow(process.execPath.includes('node') ? 'Node.js' : 'a package manager')}.\n\nTo update, please reinstall Buster or use your package manager's update command.`,
      currentVersion,
      isHomebrew,
    };
  }

  // Check for updates
  const updateCheck = await checkForUpdate(currentVersion);

  if (!updateCheck) {
    return {
      success: false,
      message: 'Unable to check for updates. Please check your internet connection.',
      currentVersion,
      isHomebrew,
    };
  }

  // If just checking, return the result
  if (validated.check) {
    if (updateCheck.updateAvailable) {
      return {
        success: true,
        message: `Update available: ${formatVersion(updateCheck.latestVersion)}\nCurrent version: ${formatVersion(currentVersion)}\n\nRun ${chalk.cyan('buster update')} to install.`,
        currentVersion,
        latestVersion: updateCheck.latestVersion,
        isHomebrew,
      };
    } else {
      return {
        success: true,
        message: `You are on the latest version (${formatVersion(currentVersion)}).`,
        currentVersion,
        latestVersion: updateCheck.latestVersion,
        isHomebrew,
      };
    }
  }

  // Check if update is needed
  if (!updateCheck.updateAvailable && !validated.force) {
    return {
      success: true,
      message: `You are already on the latest version (${formatVersion(currentVersion)}).`,
      currentVersion,
      latestVersion: updateCheck.latestVersion,
      isHomebrew,
    };
  }

  // Perform the update
  console.info(chalk.blue('Downloading update...'));

  const binaryInfo = getBinaryInfo(updateCheck.latestVersion);
  const tempDir = join(tmpdir(), `buster-update-${Date.now()}`);

  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    const archivePath = join(tempDir, binaryInfo.fileName);
    const checksumPath = join(tempDir, `${binaryInfo.fileName}.sha256`);

    // Download binary and checksum
    await Promise.all([
      downloadFile(binaryInfo.downloadUrl, archivePath),
      downloadFile(binaryInfo.checksumUrl, checksumPath),
    ]);

    // Read and validate checksum
    const checksumContent = await readFile(checksumPath, 'utf-8');

    // SHA256 checksums are 64 hex characters
    // Format can be either "checksum" or "checksum  filename"
    const checksumMatch = checksumContent.match(/^([a-f0-9]{64})/i);

    if (!checksumMatch || !checksumMatch[1]) {
      throw new Error(
        `Invalid checksum format in file. Expected SHA256 hash, got: ${checksumContent.substring(0, 100)}`
      );
    }

    const expectedChecksum = checksumMatch[1].toLowerCase();

    // Verify checksum
    console.info(chalk.blue('Verifying download...'));
    const isValid = await verifyChecksum(archivePath, expectedChecksum);

    if (!isValid) {
      throw new Error('Checksum verification failed. The download may be corrupted.');
    }

    // Extract binary
    console.info(chalk.blue('Installing update...'));
    const extractedBinary = await extractArchive(archivePath, tempDir);

    // Replace current binary
    await replaceBinary(extractedBinary);

    // Clean up temp directory
    await rm(tempDir, { recursive: true, force: true });

    return {
      success: true,
      message: chalk.green(
        `✓ Successfully updated to version ${formatVersion(updateCheck.latestVersion)}`
      ),
      currentVersion,
      latestVersion: updateCheck.latestVersion,
      isHomebrew,
    };
  } catch (error) {
    // Clean up on error
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
}
