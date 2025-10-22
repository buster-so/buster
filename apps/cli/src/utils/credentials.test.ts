import * as fs from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCredentials, getCredentials, saveCredentials } from './credentials';

// Mock the filesystem
vi.mock('node:fs/promises');

const CREDENTIALS_FILE = join(homedir(), '.buster', 'credentials.json');

describe('credentials', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.BUSTER_API_KEY;
    delete process.env.BUSTER_HOST;
    delete process.env.BUSTER_API_URL;

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('URL normalization', () => {
    it('should normalize URL without protocol when saving credentials', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await saveCredentials({
        apiKey: 'test-key',
        apiUrl: 'api2.buster.so',
      });

      expect(mockWriteFile).toHaveBeenCalledWith(
        CREDENTIALS_FILE,
        expect.stringContaining('https://api2.buster.so'),
        { mode: 0o600 }
      );
    });

    it('should preserve URL with https protocol when saving credentials', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await saveCredentials({
        apiKey: 'test-key',
        apiUrl: 'https://api2.buster.so',
      });

      expect(mockWriteFile).toHaveBeenCalledWith(
        CREDENTIALS_FILE,
        expect.stringContaining('https://api2.buster.so'),
        { mode: 0o600 }
      );
    });

    it('should preserve URL with http protocol when saving credentials', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await saveCredentials({
        apiKey: 'test-key',
        apiUrl: 'http://localhost:3002',
      });

      expect(mockWriteFile).toHaveBeenCalledWith(
        CREDENTIALS_FILE,
        expect.stringContaining('http://localhost:3002'),
        { mode: 0o600 }
      );
    });

    it('should normalize localhost URL without protocol', async () => {
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockWriteFile = vi.mocked(fs.writeFile);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      await saveCredentials({
        apiKey: 'test-key',
        apiUrl: 'localhost:3002',
      });

      expect(mockWriteFile).toHaveBeenCalledWith(
        CREDENTIALS_FILE,
        expect.stringContaining('https://localhost:3002'),
        { mode: 0o600 }
      );
    });
  });

  describe('getCredentials with environment variables', () => {
    it('should normalize URL from BUSTER_HOST environment variable', async () => {
      process.env.BUSTER_API_KEY = 'test-key';
      process.env.BUSTER_HOST = 'api2.buster.so';

      const creds = await getCredentials();

      expect(creds).toEqual({
        apiKey: 'test-key',
        apiUrl: 'https://api2.buster.so',
      });
    });

    it('should normalize URL from BUSTER_API_URL environment variable', async () => {
      process.env.BUSTER_API_KEY = 'test-key';
      process.env.BUSTER_API_URL = 'localhost:3002';

      const creds = await getCredentials();

      expect(creds).toEqual({
        apiKey: 'test-key',
        apiUrl: 'https://localhost:3002',
      });
    });

    it('should preserve URL with protocol from environment variable', async () => {
      process.env.BUSTER_API_KEY = 'test-key';
      process.env.BUSTER_HOST = 'https://api2.buster.so';

      const creds = await getCredentials();

      expect(creds).toEqual({
        apiKey: 'test-key',
        apiUrl: 'https://api2.buster.so',
      });
    });

    it('should use default URL when no URL provided', async () => {
      process.env.BUSTER_API_KEY = 'test-key';

      const creds = await getCredentials();

      expect(creds).toEqual({
        apiKey: 'test-key',
        apiUrl: 'https://api2.buster.so',
      });
    });
  });

  describe('getCredentials with saved file', () => {
    it('should normalize URL from environment override of saved credentials', async () => {
      const mockReadFile = vi.mocked(fs.readFile);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          apiKey: 'saved-key',
          apiUrl: 'https://saved.buster.so',
        })
      );

      process.env.BUSTER_HOST = 'override.buster.so';

      const creds = await getCredentials();

      expect(creds).toEqual({
        apiKey: 'saved-key',
        apiUrl: 'https://override.buster.so',
      });
    });

    it('should use saved URL when no environment override', async () => {
      const mockReadFile = vi.mocked(fs.readFile);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          apiKey: 'saved-key',
          apiUrl: 'https://saved.buster.so',
        })
      );

      const creds = await getCredentials();

      expect(creds).toEqual({
        apiKey: 'saved-key',
        apiUrl: 'https://saved.buster.so',
      });
    });
  });
});
