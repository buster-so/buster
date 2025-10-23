import type { Page } from 'playwright';
import { describe, expect, it, vi } from 'vitest';
import { assertBeforeScreenshot } from './take-screenshot';

describe('assertBeforeScreenshot', () => {
  it('should throw error when page contains "INTERNAL SERVER ERROR"', async () => {
    // Mock Page object with INTERNAL SERVER ERROR in content
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>INTERNAL SERVER ERROR</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/test/path'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, { fullPath: 'https://example.com/test/path' })
    ).rejects.toThrow('Page contains "INTERNAL SERVER ERROR" - refusing to take screenshot');
  });

  it('should throw error when page URL does not match expected path', async () => {
    // Mock Page object with wrong URL
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>Valid content</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/wrong/path'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, { fullPath: 'https://example.com/expected/path' })
    ).rejects.toThrow('Page URL mismatch - expected path "/expected/path" but got "/wrong/path"');
  });

  it('should succeed when page content is valid and URL matches expected path', async () => {
    // Mock Page object with valid content and correct URL
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>Valid content</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/test/path'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, { fullPath: 'https://example.com/test/path' })
    ).resolves.not.toThrow();
  });

  it('should normalize double slash at beginning of path and match successfully', async () => {
    // Mock Page object where fullPath has double slash but actual URL is correct
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>Valid content</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/screenshots/metrics/123/content'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, {
        fullPath: 'https://example.com//screenshots/metrics/123/content',
      })
    ).resolves.not.toThrow();
  });

  it('should normalize multiple consecutive slashes in the middle of path', async () => {
    // Mock Page object where fullPath has multiple slashes in middle
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>Valid content</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/api/v1/users/123'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, { fullPath: 'https://example.com/api///v1//users/123' })
    ).resolves.not.toThrow();
  });

  it('should normalize triple slashes at any position in path', async () => {
    // Mock Page object where fullPath has triple slashes
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>Valid content</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/test/path/data'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, { fullPath: 'https://example.com///test///path///data' })
    ).resolves.not.toThrow();
  });

  it('should normalize slashes but still fail if paths are actually different', async () => {
    // Mock Page object where even after normalization, paths don't match
    const mockPage = {
      content: vi.fn().mockResolvedValue('<html><body>Valid content</body></html>'),
      url: vi.fn().mockReturnValue('https://example.com/correct/path'),
    } as unknown as Page;

    await expect(
      assertBeforeScreenshot(mockPage, { fullPath: 'https://example.com//wrong//path' })
    ).rejects.toThrow('Page URL mismatch - expected path "/wrong/path" but got "/correct/path"');
  });
});
