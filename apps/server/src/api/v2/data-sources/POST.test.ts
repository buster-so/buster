import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDataSourceHandler } from './create-data-source';
import { createDataSourceRoute } from './POST';

// Mock the handler
vi.mock('./create-data-source');

describe('POST /data-sources', () => {
  let app: Hono;

  beforeEach(() => {
    vi.clearAllMocks();
    app = new Hono();

    // Mock authentication middleware
    app.use('*', async (c, next) => {
      c.set('busterUser', {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
      });
      await next();
    });

    app.route('/', createDataSourceRoute);
  });

  describe('Request Validation', () => {
    it('should reject empty name', async () => {
      const invalidRequest = {
        name: '', // Empty name should fail
        type: 'motherduck',
        token: 'abc123',
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const invalidRequest = {
        name: 'Test DB',
        type: 'postgresql', // Not supported yet
        token: 'abc123',
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing token', async () => {
      const invalidRequest = {
        name: 'Test DB',
        type: 'motherduck',
        // token missing
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should reject empty token', async () => {
      const invalidRequest = {
        name: 'Test DB',
        type: 'motherduck',
        token: '',
        default_database: 'test_db',
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should reject missing default_database', async () => {
      const invalidRequest = {
        name: 'Test DB',
        type: 'motherduck',
        token: 'token_abc123',
        // default_database missing
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should reject empty default_database', async () => {
      const invalidRequest = {
        name: 'Test DB',
        type: 'motherduck',
        token: 'token_abc123',
        default_database: '',
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid attach_mode values', async () => {
      const validRequest = {
        name: 'My MotherDuck DB',
        type: 'motherduck',
        token: 'token_abc123',
        default_database: 'test_db',
        attach_mode: 'single',
      };

      const mockResponse = {
        id: 'ds-123',
        name: 'My MotherDuck DB',
        type: 'motherduck',
        organizationId: 'org-123',
        createdBy: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        createdAt: '2025-01-24T12:00:00.000Z',
        updatedAt: '2025-01-24T12:00:00.000Z',
        deletedAt: null,
        onboardingStatus: 'notStarted' as const,
        onboardingError: null,
      };

      (createDataSourceHandler as any).mockResolvedValue(mockResponse);

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      expect(response.status).toBe(201);
    });

    it('should reject invalid attach_mode', async () => {
      const invalidRequest = {
        name: 'Test DB',
        type: 'motherduck',
        token: 'token_abc123',
        attach_mode: 'invalid',
      };

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Success Cases', () => {
    it('should call handler with validated request and return 201', async () => {
      const validRequest = {
        name: 'My MotherDuck DB',
        type: 'motherduck',
        token: 'token_abc123',
        default_database: 'test_db',
      };

      const mockResponse = {
        id: 'ds-123',
        name: 'My MotherDuck DB',
        type: 'motherduck',
        organizationId: 'org-123',
        createdBy: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        createdAt: '2025-01-24T12:00:00.000Z',
        updatedAt: '2025-01-24T12:00:00.000Z',
        deletedAt: null,
        onboardingStatus: 'notStarted' as const,
        onboardingError: null,
      };

      (createDataSourceHandler as any).mockResolvedValue(mockResponse);

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequest),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
      expect(createDataSourceHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        }),
        expect.objectContaining({
          name: 'My MotherDuck DB',
          type: 'motherduck',
          token: 'token_abc123',
        })
      );
    });

    it('should accept request with all optional fields', async () => {
      const fullRequest = {
        name: 'Full MotherDuck DB',
        type: 'motherduck',
        token: 'token_abc123',
        default_database: 'analytics',
        saas_mode: true,
        attach_mode: 'multi',
        connection_timeout: 10000,
        query_timeout: 30000,
      };

      const mockResponse = {
        id: 'ds-456',
        name: 'Full MotherDuck DB',
        type: 'motherduck',
        organizationId: 'org-123',
        createdBy: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        createdAt: '2025-01-24T12:00:00.000Z',
        updatedAt: '2025-01-24T12:00:00.000Z',
        deletedAt: null,
        onboardingStatus: 'notStarted' as const,
        onboardingError: null,
      };

      (createDataSourceHandler as any).mockResolvedValue(mockResponse);

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRequest),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });

    it('should accept request with minimal fields', async () => {
      const minimalRequest = {
        name: 'Minimal DB',
        type: 'motherduck',
        token: 'token_abc123',
        default_database: 'my_db',
      };

      const mockResponse = {
        id: 'ds-789',
        name: 'Minimal DB',
        type: 'motherduck',
        organizationId: 'org-123',
        createdBy: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
        },
        createdAt: '2025-01-24T12:00:00.000Z',
        updatedAt: '2025-01-24T12:00:00.000Z',
        deletedAt: null,
        onboardingStatus: 'notStarted' as const,
        onboardingError: null,
      };

      (createDataSourceHandler as any).mockResolvedValue(mockResponse);

      const response = await app.request('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalRequest),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockResponse);
    });
  });
});
