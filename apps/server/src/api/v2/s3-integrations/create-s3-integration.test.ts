import { testStorageCredentials } from '@buster/data-source';
import type { User } from '@buster/database/queries';
import { createS3Integration, createSecret, getUserOrganizationId } from '@buster/database/queries';
import type { CreateS3IntegrationRequest } from '@buster/server-shared';
import { tasks } from '@trigger.dev/sdk/v3';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { createS3IntegrationHandler } from './create-s3-integration';

vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');
vi.mock('@buster/database/connection');
vi.mock('@buster/data-source');
vi.mock('@trigger.dev/sdk/v3', () => ({
  tasks: {
    trigger: vi.fn(),
  },
}));

describe('createS3IntegrationHandler', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  } as User;

  const mockIntegration = {
    id: 'integration-123',
    provider: 's3',
    organizationId: 'org-123',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    deletedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock behaviors
    (getUserOrganizationId as Mock).mockResolvedValue({
      organizationId: 'org-123',
    });
    (testStorageCredentials as Mock).mockResolvedValue(true);
    (createS3Integration as Mock).mockResolvedValue(mockIntegration);
    (createSecret as Mock).mockResolvedValue({ id: 'secret-123' });
    (tasks.trigger as Mock).mockResolvedValue({ id: 'task-123' });
  });

  describe('S3 provider', () => {
    const s3Request: CreateS3IntegrationRequest = {
      provider: 's3',
      region: 'us-east-1',
      bucket: 'test-bucket',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    };

    it('should successfully create S3 integration', async () => {
      const result = await createS3IntegrationHandler(mockUser, s3Request);

      expect(result).toEqual({
        id: 'integration-123',
        provider: 's3',
        organizationId: 'org-123',
        bucketName: 'test-bucket',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        deletedAt: null,
      });

      expect(getUserOrganizationId).toHaveBeenCalledWith('user-123');
      expect(testStorageCredentials).toHaveBeenCalledWith({
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      });
      expect(createS3Integration).toHaveBeenCalledWith({
        provider: 's3',
        organizationId: 'org-123',
      });
      expect(createSecret).toHaveBeenCalledWith({
        secret: JSON.stringify(s3Request),
        name: 's3-integration-integration-123',
        description: 'Storage integration credentials for s3',
      });
      expect(tasks.trigger).toHaveBeenCalledWith('migrate-storage-assets', {
        integrationId: 'integration-123',
        organizationId: 'org-123',
      });
    });

    it('should validate required S3 fields', async () => {
      const invalidRequest = {
        provider: 's3',
        bucket: 'test-bucket',
        // Missing region, accessKeyId, secretAccessKey
      } as CreateS3IntegrationRequest;

      await expect(createS3IntegrationHandler(mockUser, invalidRequest)).rejects.toThrow(
        HTTPException
      );

      expect(testStorageCredentials).not.toHaveBeenCalled();
      expect(createS3Integration).not.toHaveBeenCalled();
    });
  });

  describe('R2 provider', () => {
    const r2Request: CreateS3IntegrationRequest = {
      provider: 'r2',
      accountId: 'test-account-id',
      bucket: 'test-bucket',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    };

    it('should successfully create R2 integration', async () => {
      const result = await createS3IntegrationHandler(mockUser, r2Request);

      expect(result.provider).toBe('s3'); // Integration record uses 's3' as provider
      expect(testStorageCredentials).toHaveBeenCalledWith({
        provider: 'r2',
        accountId: 'test-account-id',
        bucket: 'test-bucket',
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      });
    });

    it('should validate required R2 fields', async () => {
      const invalidRequest = {
        provider: 'r2',
        bucket: 'test-bucket',
        // Missing accountId, accessKeyId, secretAccessKey
      } as CreateS3IntegrationRequest;

      await expect(createS3IntegrationHandler(mockUser, invalidRequest)).rejects.toThrow(
        HTTPException
      );

      expect(testStorageCredentials).not.toHaveBeenCalled();
    });
  });

  describe('GCS provider', () => {
    const gcsRequest: CreateS3IntegrationRequest = {
      provider: 'gcs',
      projectId: 'test-project',
      bucket: 'test-bucket',
      serviceAccountKey: JSON.stringify({
        type: 'service_account',
        project_id: 'test-project',
        private_key: 'test-key',
        client_email: 'test@example.com',
      }),
    };

    it('should successfully create GCS integration', async () => {
      const result = await createS3IntegrationHandler(mockUser, gcsRequest);

      expect(result.provider).toBe('s3'); // Integration record uses 's3' as provider
      expect(testStorageCredentials).toHaveBeenCalledWith({
        provider: 'gcs',
        projectId: 'test-project',
        bucket: 'test-bucket',
        serviceAccountKey: gcsRequest.serviceAccountKey,
      });
    });

    it('should validate GCS service account key is valid JSON', async () => {
      const invalidRequest: CreateS3IntegrationRequest = {
        provider: 'gcs',
        projectId: 'test-project',
        bucket: 'test-bucket',
        serviceAccountKey: 'invalid-json',
      };

      await expect(createS3IntegrationHandler(mockUser, invalidRequest)).rejects.toThrow(
        HTTPException
      );

      const error = await createS3IntegrationHandler(mockUser, invalidRequest).catch((e) => e);
      expect(error).toBeInstanceOf(HTTPException);
      expect(error.status).toBe(400);

      expect(testStorageCredentials).not.toHaveBeenCalled();
    });

    it('should validate required GCS fields', async () => {
      const invalidRequest = {
        provider: 'gcs',
        bucket: 'test-bucket',
        // Missing projectId, serviceAccountKey
      } as CreateS3IntegrationRequest;

      await expect(createS3IntegrationHandler(mockUser, invalidRequest)).rejects.toThrow(
        HTTPException
      );

      expect(testStorageCredentials).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw 403 if user has no organization', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue(null);

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(403);
      expect(error.message).toContain('must be part of an organization');
    });

    it('should throw 400 if credentials are invalid', async () => {
      (testStorageCredentials as Mock).mockResolvedValue(false);

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(400);
      expect(error.message).toContain('Invalid storage credentials');
    });

    it('should throw 409 if organization already has integration', async () => {
      (createS3Integration as Mock).mockRejectedValue(
        new Error('Organization already has an active storage integration')
      );

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(409);
      expect(error.message).toContain('already has an active storage integration');
    });

    it('should throw 400 for GCS parse errors', async () => {
      (testStorageCredentials as Mock).mockRejectedValue(
        new Error('Failed to parse GCS service account key')
      );

      const request: CreateS3IntegrationRequest = {
        provider: 'gcs',
        projectId: 'test-project',
        bucket: 'test-bucket',
        serviceAccountKey: '{}',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(400);
      expect(error.message).toContain('Invalid GCS service account key format');
    });

    it('should throw 400 for GCS initialization errors', async () => {
      (testStorageCredentials as Mock).mockRejectedValue(
        new Error('Failed to initialize GCS client')
      );

      const request: CreateS3IntegrationRequest = {
        provider: 'gcs',
        projectId: 'test-project',
        bucket: 'test-bucket',
        serviceAccountKey: '{}',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(400);
      expect(error.message).toContain('Invalid storage credentials');
    });

    it('should throw 500 for unexpected errors', async () => {
      (createS3Integration as Mock).mockRejectedValue(new Error('Database error'));

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(500);
      expect(error.message).toContain('Failed to create storage integration');
    });

    it('should not fail if migration task fails to trigger', async () => {
      (tasks.trigger as Mock).mockRejectedValue(new Error('Task service unavailable'));

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await createS3IntegrationHandler(mockUser, request);

      expect(result).toBeDefined();
      expect(result.id).toBe('integration-123');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to trigger migration task',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should re-throw existing HTTPExceptions', async () => {
      const customError = new HTTPException(418, { message: "I'm a teapot" });
      (testStorageCredentials as Mock).mockRejectedValue(customError);

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      await expect(createS3IntegrationHandler(mockUser, request)).rejects.toThrow(HTTPException);

      const error = await createS3IntegrationHandler(mockUser, request).catch((e) => e);
      expect(error.status).toBe(418);
      expect(error.message).toBe("I'm a teapot");
    });
  });

  describe('logging', () => {
    it('should log credential validation steps', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const request: CreateS3IntegrationRequest = {
        provider: 's3',
        region: 'us-east-1',
        bucket: 'test-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
      };

      await createS3IntegrationHandler(mockUser, request);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'Validating storage credentials for provider:',
        's3'
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith('Testing credentials for bucket:', 'test-bucket');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Credential test result:', true);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'Migration task triggered for storage integration',
        expect.objectContaining({
          integrationId: 'integration-123',
          organizationId: 'org-123',
        })
      );

      consoleInfoSpy.mockRestore();
    });

    it('should log GCS service account key parsing', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const request: CreateS3IntegrationRequest = {
        provider: 'gcs',
        projectId: 'test-project',
        bucket: 'test-bucket',
        serviceAccountKey: JSON.stringify({
          project_id: 'test-project',
        }),
      };

      await createS3IntegrationHandler(mockUser, request);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'GCS service account key parsed successfully, project_id:',
        'test-project'
      );

      consoleInfoSpy.mockRestore();
    });
  });
});
