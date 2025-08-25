import { beforeAll, describe, expect, it } from 'vitest';
import type { R2Config } from '../types';
import { createR2Provider } from './r2-provider';

// Skip these tests if TEST_R2_* credentials are not set
const TEST_R2_ACCOUNT_ID = process.env.TEST_R2_ACCOUNT_ID;
const TEST_R2_BUCKET = process.env.TEST_R2_BUCKET;
const TEST_R2_ACCESS_KEY_ID = process.env.TEST_R2_ACCESS_KEY_ID;
const TEST_R2_SECRET_ACCESS_KEY = process.env.TEST_R2_SECRET_ACCESS_KEY;

const skipIf =
  !TEST_R2_ACCOUNT_ID || !TEST_R2_BUCKET || !TEST_R2_ACCESS_KEY_ID || !TEST_R2_SECRET_ACCESS_KEY;

describe.skipIf(skipIf)('R2 Provider Integration', () => {
  let provider: ReturnType<typeof createR2Provider>;
  const testPrefix = `integration-test-${Date.now()}`;

  beforeAll(() => {
    const config: R2Config = {
      provider: 'r2',
      accountId: TEST_R2_ACCOUNT_ID!,
      bucket: TEST_R2_BUCKET!,
      accessKeyId: TEST_R2_ACCESS_KEY_ID!,
      secretAccessKey: TEST_R2_SECRET_ACCESS_KEY!,
    };
    provider = createR2Provider(config);
  });

  describe('testConnection', () => {
    it('should successfully test connection with all permissions', async () => {
      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.canRead).toBe(true);
      expect(result.canWrite).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.error).toBeUndefined();
    }, 30000);
  });

  describe('full lifecycle', () => {
    const testKey = `${testPrefix}/test-file.txt`;
    const testData = 'Hello from R2 integration test!';

    it('should upload, download, and delete a file', async () => {
      // Upload
      const uploadResult = await provider.upload(testKey, testData, {
        contentType: 'text/plain',
        metadata: { test: 'true' },
      });

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.key).toBe(testKey);
      expect(uploadResult.size).toBe(Buffer.from(testData).length);
      expect(uploadResult.etag).toBeDefined();

      // Verify exists
      const exists = await provider.exists(testKey);
      expect(exists).toBe(true);

      // Download
      const downloadResult = await provider.download(testKey);

      expect(downloadResult.success).toBe(true);
      if (downloadResult.success) {
        expect(downloadResult.data.toString()).toBe(testData);
        expect(downloadResult.contentType).toBe('text/plain');
        expect(downloadResult.size).toBe(Buffer.from(testData).length);
      }

      // Get signed URL
      const signedUrl = await provider.getSignedUrl(testKey, 3600);
      expect(signedUrl).toMatch(/^https?:\/\//);

      // List
      const listResult = await provider.list(testPrefix);
      expect(listResult).toHaveLength(1);
      expect(listResult[0].key).toBe(testKey);
      expect(listResult[0].size).toBe(Buffer.from(testData).length);

      // Delete
      const deleteResult = await provider.delete(testKey);
      expect(deleteResult).toBe(true);

      // Verify deleted
      const existsAfterDelete = await provider.exists(testKey);
      expect(existsAfterDelete).toBe(false);
    }, 30000);

    it('should handle non-existent file gracefully', async () => {
      const nonExistentKey = `${testPrefix}/non-existent.txt`;

      const exists = await provider.exists(nonExistentKey);
      expect(exists).toBe(false);

      const downloadResult = await provider.download(nonExistentKey);
      expect(downloadResult.success).toBe(false);
      expect(downloadResult.error).toBeDefined();

      const deleteResult = await provider.delete(nonExistentKey);
      // R2 delete returns success even for non-existent files (S3-compatible behavior)
      expect(deleteResult).toBe(true);
    }, 30000);
  });
});
