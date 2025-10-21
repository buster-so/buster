import { arch, platform } from 'node:os';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getVersion } from '../../version';
import { getBinaryFileName, getBinaryInfo } from './update-handler';

// Mock os module
vi.mock('node:os', () => ({
  platform: vi.fn(),
  arch: vi.fn(),
  homedir: () => '/home/user',
  tmpdir: () => '/tmp',
}));

describe('update-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVersion', () => {
    it('should return a valid semver version string', () => {
      const version = getVersion();
      expect(version).toBeTruthy();
      expect(typeof version).toBe('string');
      // Verify it matches semver pattern (e.g., "1.2.3" or "1.2.3-beta.1")
      expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('getBinaryFileName', () => {
    it('should return correct filename for macOS arm64', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(arch).mockReturnValue('arm64');

      expect(getBinaryFileName()).toBe('buster-cli-darwin-arm64.tar.gz');
    });

    it('should return correct filename for macOS x64', () => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(arch).mockReturnValue('x64');

      expect(getBinaryFileName()).toBe('buster-cli-darwin-x86_64.tar.gz');
    });

    it('should return correct filename for Linux', () => {
      vi.mocked(platform).mockReturnValue('linux');
      vi.mocked(arch).mockReturnValue('x64');

      expect(getBinaryFileName()).toBe('buster-cli-linux-x86_64.tar.gz');
    });

    it('should return correct filename for Windows', () => {
      vi.mocked(platform).mockReturnValue('win32');
      vi.mocked(arch).mockReturnValue('x64');

      expect(getBinaryFileName()).toBe('buster-cli-windows-x86_64.zip');
    });

    it('should throw error for unsupported platform', () => {
      vi.mocked(platform).mockReturnValue('freebsd' as any);
      vi.mocked(arch).mockReturnValue('x64');

      expect(() => getBinaryFileName()).toThrow('Unsupported platform: freebsd x64');
    });
  });

  describe('getBinaryInfo', () => {
    beforeEach(() => {
      vi.mocked(platform).mockReturnValue('darwin');
      vi.mocked(arch).mockReturnValue('arm64');
    });

    it('should return correct binary info with version', () => {
      const info = getBinaryInfo('1.2.3');

      expect(info).toEqual({
        fileName: 'buster-cli-darwin-arm64.tar.gz',
        downloadUrl:
          'https://github.com/buster-so/buster/releases/download/v1.2.3/buster-cli-darwin-arm64.tar.gz',
        checksumUrl:
          'https://github.com/buster-so/buster/releases/download/v1.2.3/buster-cli-darwin-arm64.tar.gz.sha256',
      });
    });

    it('should add v prefix if not present', () => {
      const info = getBinaryInfo('2.0.0');

      expect(info.downloadUrl).toContain('/v2.0.0/');
      expect(info.checksumUrl).toContain('/v2.0.0/');
    });

    it('should not add v prefix if already present', () => {
      const info = getBinaryInfo('v3.0.0');

      expect(info.downloadUrl).toContain('/v3.0.0/');
      expect(info.checksumUrl).toContain('/v3.0.0/');
    });
  });
});
