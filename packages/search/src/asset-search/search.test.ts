import type { SearchTextData, SearchTextRequest, SearchTextResponse } from '@buster/server-shared';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { performTextSearch } from './search';

// Mock dependencies
vi.mock('@buster/database/queries', () => ({
  getUserOrganizationId: vi.fn(),
  searchText: vi.fn(),
  getAssetAncestorsForAssets: vi.fn(),
}));

vi.mock('./get-asset-screenshot', () => ({
  getAssetScreenshotSignedUrl: vi.fn(),
}));

vi.mock('@buster/data-source', () => ({
  getProviderForOrganization: vi.fn(),
}));

import { getProviderForOrganization } from '@buster/data-source';
// Import the mocked functions
import {
  getAssetAncestorsForAssets,
  getUserOrganizationId,
  searchText,
} from '@buster/database/queries';
import { getAssetScreenshotSignedUrl } from './get-asset-screenshot';

describe('search.ts - Unit Tests', () => {
  const mockUserId = 'test-user-id';
  const mockOrganizationId = 'test-org-id';

  const mockUserOrg = {
    organizationId: mockOrganizationId,
    userId: mockUserId,
  };

  const mockSearchResults: SearchTextData[] = [
    {
      assetId: 'asset-1',
      assetType: 'chat',
      title: 'Test Result 1',
      additionalText: 'This is additional text for result 1',
      updatedAt: '2024-01-01T00:00:00.000Z',
      screenshotBucketKey: 'screenshots/asset-1.png',
    },
    {
      assetId: 'asset-2',
      assetType: 'metric_file',
      title: 'Test Result 2',
      additionalText: 'This is additional text for result 2',
      updatedAt: '2024-01-01T00:00:00.000Z',
      screenshotBucketKey: 'screenshots/asset-2.png',
    },
  ];

  const mockSearchResponse: SearchTextResponse = {
    data: mockSearchResults,
    pagination: {
      page: 1,
      page_size: 10,
      has_more: false,
    },
  };

  const mockAncestors = {
    chats: [{ id: 'chat-1', title: 'Chat 1' }],
    collections: [{ id: 'collection-1', title: 'Collection 1' }],
    dashboards: [],
    reports: [],
  };

  const mockAncestorsForAssets = {
    'asset-1': mockAncestors,
    'asset-2': mockAncestors,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getUserOrganizationId as Mock).mockResolvedValue(mockUserOrg);
    (searchText as Mock).mockResolvedValue(mockSearchResponse);
    (getAssetAncestorsForAssets as Mock).mockResolvedValue(mockAncestorsForAssets);
    (getAssetScreenshotSignedUrl as Mock).mockResolvedValue('https://example.com/screenshot.png');
    (getProviderForOrganization as Mock).mockResolvedValue({});
  });

  describe('performTextSearch', () => {
    const basicSearchRequest: SearchTextRequest = {
      query: 'test query',
      page: 1,
      page_size: 10,
      includeAssetAncestors: false,
    };

    it('should perform basic text search successfully', async () => {
      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(getUserOrganizationId).toHaveBeenCalledWith(mockUserId);
      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {},
      });
      expect(getAssetScreenshotSignedUrl).not.toHaveBeenCalled();

      expect(result).toEqual({
        data: [
          {
            ...mockSearchResults[0],
            title: 'Test Result 1',
            additionalText: 'This is additional text for result 1',
          },
          {
            ...mockSearchResults[1],
            title: 'Test Result 2',
            additionalText: 'This is additional text for result 2',
          },
        ],
        pagination: {
          page: 1,
          page_size: 10,
          has_more: false,
        },
      });
    });

    it('should handle search with asset type filters', async () => {
      const searchRequestWithFilters: SearchTextRequest = {
        ...basicSearchRequest,
        assetTypes: ['chat', 'metric_file'],
      };

      await performTextSearch(mockUserId, searchRequestWithFilters);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          assetTypes: ['chat', 'metric_file'],
        },
      });
    });

    it('should handle single asset type filter', async () => {
      const searchRequestWithSingleFilter: SearchTextRequest = {
        ...basicSearchRequest,
        assetTypes: 'chat',
      };

      await performTextSearch(mockUserId, searchRequestWithSingleFilter);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          assetTypes: ['chat'],
        },
      });
    });

    it('should handle date range filters', async () => {
      const searchRequestWithDateFilters: SearchTextRequest = {
        ...basicSearchRequest,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      };

      await performTextSearch(mockUserId, searchRequestWithDateFilters);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          dateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-31T23:59:59.999Z',
          },
        },
      });
    });

    it('should handle combined filters', async () => {
      const searchRequestWithAllFilters: SearchTextRequest = {
        ...basicSearchRequest,
        assetTypes: ['chat'],
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z',
      };

      await performTextSearch(mockUserId, searchRequestWithAllFilters);

      expect(searchText).toHaveBeenCalledWith({
        userId: mockUserId,
        searchString: 'test query',
        organizationId: mockOrganizationId,
        page: 1,
        page_size: 10,
        filters: {
          assetTypes: ['chat'],
          dateRange: {
            startDate: '2024-01-01T00:00:00.000Z',
            endDate: '2024-01-31T23:59:59.999Z',
          },
        },
      });
    });

    it('should include asset ancestors when requested', async () => {
      const searchRequestWithAncestors: SearchTextRequest = {
        ...basicSearchRequest,
        includeAssetAncestors: true,
      };

      const result = await performTextSearch(mockUserId, searchRequestWithAncestors);

      expect(getAssetAncestorsForAssets).toHaveBeenCalledTimes(1);
      expect(getAssetAncestorsForAssets).toHaveBeenCalledWith({
        assets: [
          { assetId: 'asset-1', assetType: 'chat' },
          { assetId: 'asset-2', assetType: 'metric_file' },
        ],
        userId: mockUserId,
        organizationId: mockOrganizationId,
      });

      expect(result.data[0]).toHaveProperty('ancestors', mockAncestors);
      expect(result.data[1]).toHaveProperty('ancestors', mockAncestors);
    });

    it('should include screenshots when requested', async () => {
      const searchRequestWithScreenshots: SearchTextRequest = {
        ...basicSearchRequest,
        includeScreenshots: true,
      };

      const screenshotUrl = 'https://example.com/screenshot.png';
      (getAssetScreenshotSignedUrl as Mock).mockResolvedValue(screenshotUrl);
      const mockProvider = {};
      (getProviderForOrganization as Mock).mockResolvedValue(mockProvider);

      const result = await performTextSearch(mockUserId, searchRequestWithScreenshots);

      expect(getAssetScreenshotSignedUrl).toHaveBeenCalledTimes(mockSearchResults.length);
      expect(getAssetScreenshotSignedUrl).toHaveBeenNthCalledWith(
        1,
        {
          key: 'screenshots/asset-1.png',
        },
        mockProvider
      );
      expect(getAssetScreenshotSignedUrl).toHaveBeenNthCalledWith(
        2,
        {
          key: 'screenshots/asset-2.png',
        },
        mockProvider
      );

      expect(result.data[0]).toHaveProperty('screenshotUrl', screenshotUrl);
      expect(result.data[1]).toHaveProperty('screenshotUrl', screenshotUrl);
    });

    it('should continue without screenshots if fetching fails', async () => {
      const searchRequestWithScreenshots: SearchTextRequest = {
        ...basicSearchRequest,
        includeScreenshots: true,
      };

      (getAssetScreenshotSignedUrl as Mock).mockRejectedValueOnce(new Error('missing screenshot'));
      (getAssetScreenshotSignedUrl as Mock).mockRejectedValueOnce(new Error('missing screenshot'));

      const result = await performTextSearch(mockUserId, searchRequestWithScreenshots);

      expect(getAssetScreenshotSignedUrl).toHaveBeenCalledTimes(mockSearchResults.length);
      expect(result.data[0]).not.toHaveProperty('screenshotUrl');
      expect(result.data[1]).not.toHaveProperty('screenshotUrl');
    });

    it('should not include ancestors when not requested', async () => {
      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(getAssetAncestorsForAssets).not.toHaveBeenCalled();
      expect(result.data[0]).not.toHaveProperty('ancestors');
      expect(result.data[1]).not.toHaveProperty('ancestors');
    });

    it('should handle empty search results', async () => {
      const emptySearchResponse: SearchTextResponse = {
        data: [],
        pagination: {
          page: 1,
          page_size: 10,
          has_more: false,
        },
      };

      (searchText as Mock).mockResolvedValue(emptySearchResponse);

      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(result).toEqual(emptySearchResponse);
      expect(getAssetAncestorsForAssets).not.toHaveBeenCalled();
    });

    it('should handle null/undefined additional text', async () => {
      const mockResultsWithNullText: SearchTextData[] = [
        {
          assetId: 'asset-1',
          assetType: 'chat',
          title: 'Test Result 1',
          additionalText: null,
          updatedAt: '2024-01-01T00:00:00.000Z',
          screenshotBucketKey: 'screenshots/asset-1.png',
        },
      ];

      (searchText as Mock).mockResolvedValue({
        ...mockSearchResponse,
        data: mockResultsWithNullText,
      });

      await performTextSearch(mockUserId, basicSearchRequest);
    });

    it('should handle null query', async () => {
      const searchRequestWithNullQuery: SearchTextRequest = {
        ...basicSearchRequest,
        query: null,
      };

      await performTextSearch(mockUserId, searchRequestWithNullQuery);
    });

    it('should throw error when user has no organization', async () => {
      (getUserOrganizationId as Mock).mockResolvedValue(null);

      await expect(performTextSearch(mockUserId, basicSearchRequest)).rejects.toThrow(
        'User is not associated with an organization'
      );

      expect(searchText).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      (searchText as Mock).mockRejectedValue(error);

      await expect(performTextSearch(mockUserId, basicSearchRequest)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should process search results in chunks when including ancestors', async () => {
      // Create many search results to test chunking
      const manyResults: SearchTextData[] = Array.from({ length: 12 }, (_, i) => ({
        assetId: `asset-${i + 1}`,
        assetType: 'chat',
        title: `Test Result ${i + 1}`,
        additionalText: `Additional text ${i + 1}`,
        updatedAt: '2024-01-01T00:00:00.000Z',
        screenshotBucketKey: `screenshots/asset-${i + 1}.png`,
      }));

      (searchText as Mock).mockResolvedValue({
        ...mockSearchResponse,
        data: manyResults,
        pagination: {
          page: 1,
          page_size: 10,
          has_more: true,
        },
      });

      // Set up mock ancestors for all 12 assets
      const manyAncestorsForAssets = Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [`asset-${i + 1}`, mockAncestors])
      );
      (getAssetAncestorsForAssets as Mock).mockResolvedValue(manyAncestorsForAssets);

      const searchRequestWithAncestors: SearchTextRequest = {
        ...basicSearchRequest,
        includeAssetAncestors: true,
      };

      const result = await performTextSearch(mockUserId, searchRequestWithAncestors);

      // Should call getAssetAncestorsForAssets once for the batch
      expect(getAssetAncestorsForAssets).toHaveBeenCalledTimes(1);

      // Results should have ancestors added
      expect(result.data).toHaveLength(12);
      result.data.forEach((item) => {
        expect(item).toHaveProperty('ancestors', mockAncestors);
      });
    });

    it('should handle ancestor lookup failures gracefully', async () => {
      const searchRequestWithAncestors: SearchTextRequest = {
        ...basicSearchRequest,
        includeAssetAncestors: true,
      };

      (getAssetAncestorsForAssets as Mock).mockRejectedValue(new Error('Ancestor lookup failed'));

      await expect(performTextSearch(mockUserId, searchRequestWithAncestors)).rejects.toThrow(
        'Ancestor lookup failed'
      );
    });

    it('should preserve original search response metadata', async () => {
      const searchResponseWithMetadata: SearchTextResponse = {
        ...mockSearchResponse,
        pagination: {
          page: 2,
          page_size: 25,
          has_more: true,
        },
      };

      (searchText as Mock).mockResolvedValue(searchResponseWithMetadata);

      const result = await performTextSearch(mockUserId, basicSearchRequest);

      expect(result.pagination.has_more).toBe(true);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.page_size).toBe(25);
    });
  });
});
