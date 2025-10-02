import { getProviderForOrganization } from '@buster/data-source';
import {
  type SearchFilters,
  getAssetAncestorsForAssets,
  getUserOrganizationId,
  searchText,
} from '@buster/database/queries';
import type {
  AssetAncestors,
  AssetType,
  SearchTextData,
  SearchTextRequest,
  SearchTextResponse,
} from '@buster/server-shared';
import { getAssetScreenshotSignedUrl } from './get-asset-screenshot';
import { processSearchResultText } from './text-processing-helpers';

/**
 * Perform text search and enhance results with asset ancestors
 * @param userId - The user ID making the request
 * @param searchRequest - The search request parameters
 * @returns Promise<SearchTextResponse> - Search results with ancestors
 */
export async function performTextSearch(
  userId: string,
  searchRequest: SearchTextRequest
): Promise<SearchTextResponse> {
  const startTime = performance.now();
  console.info(
    `[SEARCH_PIPELINE_TIMING] Starting performTextSearch for user: ${userId}, query: "${searchRequest.query}"`
  );

  // Get user's organization
  const userOrg = await getUserOrganizationId(userId);

  if (!userOrg) {
    throw new Error('User is not associated with an organization');
  }

  const trimmedQuery = searchRequest.query?.trim();
  const filters: SearchFilters = {};

  if (searchRequest.assetTypes) {
    filters.assetTypes = Array.isArray(searchRequest.assetTypes)
      ? searchRequest.assetTypes
      : [searchRequest.assetTypes];
  }

  if (searchRequest.endDate || searchRequest.startDate) {
    filters.dateRange = {
      endDate: searchRequest.endDate,
      startDate: searchRequest.startDate,
    };
  }

  // Perform the text search
  const searchStart = performance.now();
  let result: SearchTextResponse = await searchText({
    userId,
    searchString: trimmedQuery,
    organizationId: userOrg.organizationId,
    page: searchRequest.page,
    page_size: searchRequest.page_size,
    filters,
  });
  const searchDuration = performance.now() - searchStart;

  let screenshotsDuration = 0;
  let ancestorsDuration = 0;

  const screenshotsStart = performance.now();
  const screenshotsPromise = searchRequest.includeScreenshots
    ? fetchScreenshotsByAssetId(result.data, userOrg.organizationId).then((map) => {
        screenshotsDuration = performance.now() - screenshotsStart;
        return map;
      })
    : Promise.resolve<Record<string, string> | null>(null);

  const ancestorsStart = performance.now();
  const ancestorsPromise = searchRequest.includeAssetAncestors
    ? fetchAncestorsByAssetId(result.data, userId, userOrg.organizationId).then((map) => {
        ancestorsDuration = performance.now() - ancestorsStart;
        return map;
      })
    : Promise.resolve<Record<string, AssetAncestors> | null>(null);

  const [screenshotsByAssetId, ancestorsByAssetId] = await Promise.all([
    screenshotsPromise,
    ancestorsPromise,
  ]);

  // Process screenshots and ancestors in a single loop
  const processedData = result.data.map((searchResult) => {
    const updates: Partial<SearchTextData> = {};

    // Add screenshot URL if available
    if (screenshotsByAssetId) {
      const screenshotUrl = screenshotsByAssetId[searchResult.assetId];
      if (screenshotUrl) {
        updates.screenshotUrl = screenshotUrl;
      }
    }

    // Add ancestors if available
    if (ancestorsByAssetId) {
      updates.ancestors = ancestorsByAssetId[searchResult.assetId] ?? createEmptyAncestors();
    }

    // Return original result if no updates, otherwise merge updates
    return Object.keys(updates).length > 0 ? { ...searchResult, ...updates } : searchResult;
  });

  result = {
    ...result,
    data: processedData,
  };

  // TODO: Remove this block once we decide if pgroonga highlighting is good enough
  // // Process search result text (highlighting)
  // const textProcessingStart = performance.now();
  // const highlightedResults = await Promise.all(
  //   result.data.map(async (searchResult) => {
  //     const { processedTitle, processedAdditionalText } = processSearchResultText(
  //       searchRequest.query ?? '',
  //       searchResult.title,
  //       searchResult.additionalText ?? ''
  //     );
  //     return {
  //       ...searchResult,
  //       title: processedTitle,
  //       additionalText: processedAdditionalText,
  //     };
  //   })
  // );
  // result = {
  //   ...result,
  //   data: highlightedResults,
  // };
  // const textProcessingDuration = performance.now() - textProcessingStart;

  // Add ancestors if requested
  const totalDuration = performance.now() - startTime;
  console.info(
    `[SEARCH_PIPELINE_TIMING] performTextSearch completed in ${totalDuration.toFixed(2)}ms total (search: ${searchDuration.toFixed(2)}ms, screenshots: ${screenshotsDuration.toFixed(2)}ms, ancestors: ${ancestorsDuration.toFixed(2)}ms)`
  );

  return result;
}

function createEmptyAncestors(): AssetAncestors {
  return {
    chats: [],
    collections: [],
    dashboards: [],
    reports: [],
  };
}

async function fetchAncestorsByAssetId(
  searchResults: SearchTextData[],
  userId: string,
  organizationId: string
): Promise<Record<string, AssetAncestors>> {
  if (searchResults.length === 0) {
    return {};
  }

  const chunkSize = 50;
  const ancestorsByAssetId: Record<string, AssetAncestors> = {};
  const totalChunks = Math.ceil(searchResults.length / chunkSize);

  console.info(
    `[SEARCH_PIPELINE_TIMING] Processing ${searchResults.length} results in ${totalChunks} chunks of ${chunkSize}`
  );

  for (let i = 0; i < searchResults.length; i += chunkSize) {
    const chunk = searchResults.slice(i, i + chunkSize);
    const chunkAncestors = await getAssetAncestorsForAssets({
      assets: chunk.map((searchResult) => ({
        assetId: searchResult.assetId,
        assetType: searchResult.assetType as AssetType,
      })),
      userId,
      organizationId,
    });

    Object.assign(ancestorsByAssetId, chunkAncestors);
  }

  return ancestorsByAssetId;
}

async function fetchScreenshotsByAssetId(
  searchResults: SearchTextData[],
  organizationId: string
): Promise<Record<string, string>> {
  if (searchResults.length === 0) {
    return {};
  }

  const provider = await getProviderForOrganization(organizationId);

  const entries = await Promise.all(
    searchResults.map(async (searchResult) => {
      try {
        if (!searchResult.screenshotBucketKey) {
          return null;
        }
        const screenshotUrl = await getAssetScreenshotSignedUrl(
          { key: searchResult.screenshotBucketKey },
          provider
        );

        return [searchResult.assetId, screenshotUrl] as const;
      } catch {
        return null;
      }
    })
  );

  return entries.reduce<Record<string, string>>((acc, entry) => {
    if (entry) {
      const [assetId, screenshotUrl] = entry;
      acc[assetId] = screenshotUrl;
    }
    return acc;
  }, {});
}
