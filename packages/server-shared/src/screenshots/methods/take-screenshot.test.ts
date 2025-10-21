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
});
