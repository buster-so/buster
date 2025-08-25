import { beforeAll, describe, expect, it } from 'vitest';
import type { S3Config } from '../types';
import { createS3Provider } from './s3-provider';

// Skip these tests if TEST_S3_* credentials are not set
const TEST_S3_REGION = process.env.TEST_S3_REGION;
const TEST_S3_BUCKET = process.env.TEST_S3_BUCKET;
const TEST_S3_ACCESS_KEY_ID = process.env.TEST_S3_ACCESS_KEY_ID;
const TEST_S3_SECRET_ACCESS_KEY = process.env.TEST_S3_SECRET_ACCESS_KEY;

const skipIf =
  !TEST_S3_REGION || !TEST_S3_BUCKET || !TEST_S3_ACCESS_KEY_ID || !TEST_S3_SECRET_ACCESS_KEY;

describe.skipIf(skipIf)('S3 Provider Integration', () => {
  let provider: ReturnType<typeof createS3Provider>;
  const testPrefix = `integration-test-${Date.now()}`;

  beforeAll(() => {
    const config: S3Config = {
      provider: 's3',
      region: TEST_S3_REGION!,
      bucket: TEST_S3_BUCKET!,
      accessKeyId: TEST_S3_ACCESS_KEY_ID!,
      secretAccessKey: TEST_S3_SECRET_ACCESS_KEY!,
    };
    provider = createS3Provider(config);
  });

  describe('testConnection', () => {
    it('should successfully test connection with all permissions', async () => {
      const result = await provider.testConnection();

      expect(result.success).toBe(true);
      expect(result.canRead).toBe(true);
      expect(result.canWrite).toBe(true);
      expect(result.canDelete).toBe(true);
      expect(result.error).toBeUndefined();
    }, 30000); // 30 second timeout for network operations
  });

  describe('full lifecycle', () => {
    const testKey = `${testPrefix}/test-file.txt`;
    const testData = 'Hello from S3 integration test!';

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
      // S3 delete returns success even for non-existent files
      expect(deleteResult).toBe(true);
    }, 30000);
  });
});
