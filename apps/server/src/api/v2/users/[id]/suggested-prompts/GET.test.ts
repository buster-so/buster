import { generateSuggestedMessages } from '@buster/ai';
import {
  getPermissionedDatasets,
  getUserRecentMessages,
  getUserSuggestedPrompts,
  type User,
  updateUserSuggestedPrompts,
} from '@buster/database/queries';
import {
  DEFAULT_USER_SUGGESTED_PROMPTS,
  type UserSuggestedPromptsType,
} from '@buster/database/schema-types';
import { Hono } from 'hono';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import app from './GET';

// Mock all external dependencies
vi.mock('@buster/ai');
vi.mock('@buster/database/connection');
vi.mock('@buster/database/queries');
vi.mock('@buster/database/schema');

describe('GET /api/v2/users/:id/suggested-prompts', () => {
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
    organizationId: '123e4567-e89b-12d3-a456-426614174001',
  } as User;

  // Use actual DEFAULT_USER_SUGGESTED_PROMPTS instead of mock

  const mockTodayPrompts: UserSuggestedPromptsType = {
    suggestedPrompts: {
      report: ['Generate Q4 sales report'],
      dashboard: ['Create revenue dashboard'],
      visualization: ['Show top products chart'],
      help: ['How to use analytics?'],
    },
    updatedAt: new Date().toISOString(), // Today's date
  };

  const mockOldPrompts: UserSuggestedPromptsType = {
    suggestedPrompts: {
      report: ['Old report prompt'],
      dashboard: ['Old dashboard prompt'],
      visualization: ['Old viz prompt'],
      help: ['Old help prompt'],
    },
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
  };

  const mockGeneratedPrompts = {
    report: ['New AI generated report'],
    dashboard: ['New AI generated dashboard'],
    visualization: ['New AI generated chart'],
    help: ['New AI generated help'],
  };

  const mockUpdatedPrompts: UserSuggestedPromptsType = {
    suggestedPrompts: mockGeneratedPrompts,
    updatedAt: new Date().toISOString(),
  };

  const mockDatasets = [
    {
      id: 'dataset-1',
      ymlContent: 'table: users\ncolumns:\n  - id\n  - name',
    },
    {
      id: 'dataset-2',
      ymlContent: 'table: orders\ncolumns:\n  - id\n  - total',
    },
  ];

  const mockChatHistory = [
    {
      requestMessage: 'Show me sales data',
      responseMessages: 'Here is your sales data...',
    },
    {
      requestMessage: 'Create a dashboard',
      responseMessages: 'I created a dashboard for you...',
    },
  ];

  // Helper function to create test app with proper setup
  const createTestApp = () => {
    const testApp = new Hono();
    testApp.use('*', async (c, next) => {
      c.set('busterUser', mockUser);
      await next();
    });
    testApp.route('/:id', app); // Mount with :id parameter
    return testApp;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default successful mocks
    (getPermissionedDatasets as Mock).mockResolvedValue({
      datasets: mockDatasets,
    });
    (getUserRecentMessages as Mock).mockResolvedValue(mockChatHistory);
    (generateSuggestedMessages as Mock).mockResolvedValue(mockGeneratedPrompts);
    (updateUserSuggestedPrompts as Mock).mockResolvedValue(mockUpdatedPrompts);
  });

  describe('Authorization', () => {
    it('should return 403 when user tries to access another users prompts', async () => {
      const testApp = createTestApp();
      const differentUserId = '223e4567-e89b-12d3-a456-426614174000'; // Different valid UUID

      const response = await testApp.request(`/${differentUserId}`, {
        method: 'GET',
      });

      expect(response.status).toBe(403);
      const text = await response.text();
      expect(text).toContain('Forbidden: You can only access your own suggested prompts');
    });

    it('should allow user to access their own prompts', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockTodayPrompts);
      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      expect(getUserSuggestedPrompts).toHaveBeenCalledWith({ userId: mockUser.id });
    });
  });

  describe('Cached prompts (today)', () => {
    it('should return cached prompts when they were updated today', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockTodayPrompts);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockTodayPrompts);

      // Should not call AI generation functions
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
      expect(updateUserSuggestedPrompts).not.toHaveBeenCalled();
    });

    it('should return cached prompts even if updated time is just a few minutes ago today', async () => {
      // Create a date that is definitely today - just 5 minutes ago
      // This ensures we're testing the "same day" logic properly
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const recentPrompts = {
        ...mockTodayPrompts,
        updatedAt: fiveMinutesAgo.toISOString(),
      };
      (getUserSuggestedPrompts as Mock).mockResolvedValue(recentPrompts);

      // Also need to mock what would happen if it DID generate
      // (though it shouldn't in this test)
      (generateSuggestedMessages as Mock).mockResolvedValue(mockGeneratedPrompts);
      (updateUserSuggestedPrompts as Mock).mockResolvedValue(mockUpdatedPrompts);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(recentPrompts);
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
      expect(updateUserSuggestedPrompts).not.toHaveBeenCalled();
    });
  });

  describe('Fire-and-forget background generation (old cache)', () => {
    it('should return old prompts immediately for fast response', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      // Should return old prompts immediately for fast response
      expect(body).toEqual(mockOldPrompts);

      // Note: Background generation does run, but response is sent before waiting for it
      // This is the intended behavior - immediate response with background refresh
    });

    it('should handle background generation failures gracefully without affecting response', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      // Make background generation fail
      (generateSuggestedMessages as Mock).mockRejectedValue(new Error('AI service unavailable'));

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      // Should still return old prompts immediately, regardless of background failure
      expect(body).toEqual(mockOldPrompts);
    });

    it('should trigger background generation when prompts are old', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      // Should return old prompts immediately
      expect(body).toEqual(mockOldPrompts);

      // Allow background promise to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Background generation should have been triggered
      expect(generateSuggestedMessages).toHaveBeenCalledWith({
        chatHistoryText: expect.stringContaining('userMessage: Show me sales data'),
        databaseContext: expect.stringContaining('table: users'),
        userId: mockUser.id,
      });
      expect(updateUserSuggestedPrompts).toHaveBeenCalledWith({
        userId: mockUser.id,
        suggestedPrompts: mockGeneratedPrompts,
      });
    });
  });

  describe('Database context scenarios', () => {
    it('should return old prompts immediately when datasets are empty', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getPermissionedDatasets as Mock).mockResolvedValue({ datasets: [] });

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts immediately
    });

    it('should return old prompts immediately when datasets have no YAML content', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getPermissionedDatasets as Mock).mockResolvedValue({
        datasets: [
          { id: 'dataset-1', ymlContent: null },
          { id: 'dataset-2', ymlContent: '' },
          { id: 'dataset-3', ymlContent: '   ' }, // whitespace only
        ],
      });

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts immediately
    });
  });

  describe('Chat history scenarios', () => {
    it('should return old prompts immediately when chat history is empty', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(mockOldPrompts);
      (getUserRecentMessages as Mock).mockResolvedValue([]);
      // Clear the default successful mock for this test
      (getPermissionedDatasets as Mock).mockResolvedValue({ datasets: [] });

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(mockOldPrompts); // Should return old prompts immediately
    });
  });

  describe('Error handling and fallbacks', () => {
    it('should return 500 when getUserSuggestedPrompts fails', async () => {
      (getUserSuggestedPrompts as Mock).mockRejectedValue(new Error('Database connection failed'));

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(500);
      const body = (await response.json()) as { error: string; message: string };
      expect(body.error).toBe('Internal Server Error');
      expect(body.message).toBe('Database connection failed');
    });

    it('should return default prompts when no current prompts exist', async () => {
      (getUserSuggestedPrompts as Mock).mockResolvedValue(null);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(DEFAULT_USER_SUGGESTED_PROMPTS);

      // Background generation should not be triggered when no prompts exist
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
    });
  });

  describe('Input validation', () => {
    it('should return 400 for invalid UUID format', async () => {
      const testApp = createTestApp();

      const response = await testApp.request('/invalid-uuid', {
        method: 'GET',
      });

      expect(response.status).toBe(400);
    });

    it('should return 404 for empty user ID (route not found)', async () => {
      const testApp = createTestApp();

      const response = await testApp.request('/', {
        method: 'GET',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Date comparison edge cases', () => {
    it('should return old prompts immediately even when they are from 23:59 yesterday', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const yesterdayPrompts = {
        ...mockOldPrompts,
        updatedAt: yesterday.toISOString(),
      };
      (getUserSuggestedPrompts as Mock).mockResolvedValue(yesterdayPrompts);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      // Should return old prompts immediately, background generation triggers after response
      expect(body).toEqual(yesterdayPrompts);

      // Allow background promise to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Background generation should have been triggered for old prompts
      expect(generateSuggestedMessages).toHaveBeenCalled();
    });

    it('should consider prompts updated at 00:01 today as fresh', async () => {
      const today = new Date();
      today.setHours(0, 1, 0, 0);

      const earlyTodayPrompts = {
        ...mockTodayPrompts,
        updatedAt: today.toISOString(),
      };
      (getUserSuggestedPrompts as Mock).mockResolvedValue(earlyTodayPrompts);

      const testApp = createTestApp();

      const response = await testApp.request(`/${mockUser.id}`, {
        method: 'GET',
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual(earlyTodayPrompts);
      // Should not trigger new generation
      expect(generateSuggestedMessages).not.toHaveBeenCalled();
    });
  });
});
