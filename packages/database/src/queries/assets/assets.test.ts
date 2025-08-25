import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../connection';
import { dashboardFiles, messages, metricFiles, reportFiles } from '../../schema';
import { type DatabaseAssetType, generateAssetMessages, getAssetDetailsById } from './assets';

// Mock the database connection
vi.mock('../../connection', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
  },
}));

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid-123'),
});

describe('Asset Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAssetDetailsById', () => {
    it('should fetch report file details correctly', async () => {
      const mockReport = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Q4 Financial Report',
        content: 'This is the report content in markdown format',
        versionHistory: {
          '1': {
            content: 'Initial version',
            updated_at: '2024-01-01',
            version_number: 1,
          },
          '2': {
            content: 'Updated version',
            updated_at: '2024-01-02',
            version_number: 2,
          },
        },
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
      };

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReport]),
      };

      vi.mocked(db).select.mockReturnValue(mockDbChain as any);

      const result = await getAssetDetailsById({
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        assetType: 'report_file' as DatabaseAssetType,
      });

      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Q4 Financial Report',
        content: 'This is the report content in markdown format',
        versionNumber: 2, // Should get the highest version number
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
      });

      expect(db.select).toHaveBeenCalledWith({
        id: reportFiles.id,
        name: reportFiles.name,
        content: reportFiles.content,
        versionHistory: reportFiles.versionHistory,
        createdBy: reportFiles.createdBy,
      });
    });

    it('should return version 1 when report has no version history', async () => {
      const mockReport = {
        id: '223e4567-e89b-12d3-a456-426614174000',
        name: 'Monthly Report',
        content: 'Report content',
        versionHistory: null,
        createdBy: '223e4567-e89b-12d3-a456-426614174001',
      };

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReport]),
      };

      vi.mocked(db).select.mockReturnValue(mockDbChain as any);

      const result = await getAssetDetailsById({
        assetId: '223e4567-e89b-12d3-a456-426614174000',
        assetType: 'report_file' as DatabaseAssetType,
      });

      expect(result?.versionNumber).toBe(1);
    });

    it('should return null when report does not exist', async () => {
      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).select.mockReturnValue(mockDbChain as any);

      const result = await getAssetDetailsById({
        assetId: '323e4567-e89b-12d3-a456-426614174000',
        assetType: 'report_file' as DatabaseAssetType,
      });

      expect(result).toBeNull();
    });

    it('should fetch metric file details correctly', async () => {
      const mockMetric = {
        id: '423e4567-e89b-12d3-a456-426614174000',
        name: 'Revenue Metric',
        content: { query: 'SELECT * FROM revenue' },
        versionHistory: {},
        createdBy: '423e4567-e89b-12d3-a456-426614174001',
      };

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockMetric]),
      };

      vi.mocked(db).select.mockReturnValue(mockDbChain as any);

      const result = await getAssetDetailsById({
        assetId: '423e4567-e89b-12d3-a456-426614174000',
        assetType: 'metric_file' as DatabaseAssetType,
      });

      expect(result).toEqual({
        id: '423e4567-e89b-12d3-a456-426614174000',
        name: 'Revenue Metric',
        content: { query: 'SELECT * FROM revenue' },
        versionNumber: 1,
        createdBy: '423e4567-e89b-12d3-a456-426614174001',
      });

      expect(db.select).toHaveBeenCalledWith({
        id: metricFiles.id,
        name: metricFiles.name,
        content: metricFiles.content,
        versionHistory: metricFiles.versionHistory,
        createdBy: metricFiles.createdBy,
      });
    });

    it('should fetch dashboard file details correctly', async () => {
      const mockDashboard = {
        id: '523e4567-e89b-12d3-a456-426614174000',
        name: 'Sales Dashboard',
        content: {
          name: 'Sales Dashboard',
          rows: [],
        },
        versionHistory: {},
        createdBy: '523e4567-e89b-12d3-a456-426614174001',
      };

      const mockDbChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockDashboard]),
      };

      vi.mocked(db).select.mockReturnValue(mockDbChain as any);

      const result = await getAssetDetailsById({
        assetId: '523e4567-e89b-12d3-a456-426614174000',
        assetType: 'dashboard_file' as DatabaseAssetType,
      });

      expect(result).toEqual({
        id: '523e4567-e89b-12d3-a456-426614174000',
        name: 'Sales Dashboard',
        content: {
          name: 'Sales Dashboard',
          rows: [],
        },
        versionNumber: 1,
        createdBy: '523e4567-e89b-12d3-a456-426614174001',
      });
    });
  });

  describe('generateAssetMessages', () => {
    it('should generate messages for report files', async () => {
      const mockReport = {
        id: '623e4567-e89b-12d3-a456-426614174000',
        name: 'Annual Report 2024',
        content: '# Annual Report\n\nThis is the annual report content.',
        createdBy: '623e4567-e89b-12d3-a456-426614174001',
      };

      // Mock getAssetDetails (internal function call)
      const selectMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReport]),
      };

      const insertMock = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: '723e4567-e89b-12d3-a456-426614174000',
            chatId: '823e4567-e89b-12d3-a456-426614174000',
            createdBy: '623e4567-e89b-12d3-a456-426614174001',
            requestMessage: null,
            responseMessages: expect.any(Array),
            reasoning: [],
            finalReasoningMessage: '',
            title: 'Annual Report 2024',
            rawLlmMessages: expect.any(Array),
            isCompleted: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      };

      vi.mocked(db).select.mockReturnValue(selectMock as any);
      vi.mocked(db).insert.mockReturnValue(insertMock as any);

      const result = await generateAssetMessages({
        assetId: '623e4567-e89b-12d3-a456-426614174000',
        assetType: 'report_file',
        userId: '623e4567-e89b-12d3-a456-426614174001',
        chatId: '823e4567-e89b-12d3-a456-426614174000',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '723e4567-e89b-12d3-a456-426614174000',
        chatId: '823e4567-e89b-12d3-a456-426614174000',
        title: 'Annual Report 2024',
        isCompleted: true,
        requestMessage: null,
      });

      // Verify the insert was called with correct structure
      expect(insertMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '823e4567-e89b-12d3-a456-426614174000',
          createdBy: '623e4567-e89b-12d3-a456-426614174001',
          title: 'Annual Report 2024',
          isCompleted: true,
          requestMessage: null,
        })
      );
    });

    it('should throw error when report asset is not found', async () => {
      const selectMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(db).select.mockReturnValue(selectMock as any);

      await expect(
        generateAssetMessages({
          assetId: '923e4567-e89b-12d3-a456-426614174000',
          assetType: 'report_file',
          userId: 'a23e4567-e89b-12d3-a456-426614174000',
          chatId: 'b23e4567-e89b-12d3-a456-426614174000',
        })
      ).rejects.toThrow('Asset not found: 923e4567-e89b-12d3-a456-426614174000');
    });

    it('should generate correct asset type string for reports', async () => {
      const mockReport = {
        id: 'c23e4567-e89b-12d3-a456-426614174000',
        name: 'Test Report',
        content: 'Test content',
        createdBy: 'd23e4567-e89b-12d3-a456-426614174000',
      };

      const selectMock = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockReport]),
      };

      const insertMock = {
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([
          {
            id: 'e23e4567-e89b-12d3-a456-426614174000',
            responseMessages: [
              {
                type: 'text',
                message:
                  'Test Report has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.',
              },
              {
                type: 'file',
                file_type: 'report', // This should be 'report', not 'dashboard' or 'metric'
              },
            ],
          },
        ]),
      };

      vi.mocked(db).select.mockReturnValue(selectMock as any);
      vi.mocked(db).insert.mockReturnValue(insertMock as any);

      await generateAssetMessages({
        assetId: 'c23e4567-e89b-12d3-a456-426614174000',
        assetType: 'report_file',
        userId: 'd23e4567-e89b-12d3-a456-426614174000',
        chatId: 'f23e4567-e89b-12d3-a456-426614174000',
      });

      // Check that the values method was called with report file_type
      const valuesCall = insertMock.values.mock.calls[0][0];
      const responseMessages = valuesCall.responseMessages;

      expect(responseMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'file',
            file_type: 'report',
          }),
        ])
      );
    });
  });
});
