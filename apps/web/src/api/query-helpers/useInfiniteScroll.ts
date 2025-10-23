import type {
  GroupedPaginationResponse,
  PaginatedResponse,
  SearchPaginatedResponse,
} from '@buster/server-shared/type-utilities';
import type {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import type { ApiError } from '@/api/errors';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Configuration for infinite scroll behavior
 */
const InfiniteScrollConfigSchema = {
  /**
   * Distance in pixels from the bottom to trigger next page fetch
   * @default 100
   */
  scrollThreshold: 100,
} as const;

type InfiniteScrollConfig = {
  scrollThreshold?: number;
};

/**
 * Pagination response types - supports search, standard pagination, and grouped responses
 */
type PaginationResponse<TData> =
  | SearchPaginatedResponse<TData>
  | PaginatedResponse<TData>
  | GroupedPaginationResponse<TData>;

/**
 * Hook options extending react-query's infinite query options
 */
type UseInfiniteScrollOptions<TData, TError = ApiError> = Omit<
  UseInfiniteQueryOptions<
    PaginationResponse<TData>,
    TError,
    InfiniteData<PaginationResponse<TData>>,
    QueryKey,
    number
  >,
  'getNextPageParam' | 'initialPageParam'
> & {
  /**
   * Infinite scroll configuration
   */
  scrollConfig?: InfiniteScrollConfig;
  mounted?: boolean;
};

/**
 * Return type for useInfiniteScroll hook
 */
type UseInfiniteScrollResult<TData, TError = ApiError> = UseInfiniteQueryResult<
  InfiniteData<PaginationResponse<TData>>,
  TError
> & {
  /**
   * Ref to attach to the scrollable container element
   */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Flattened array of all results from all pages
   * For grouped responses, this flattens all groups into a single array
   */
  allResults: TData[];
  /**
   * Grouped results when using grouped pagination
   * Undefined for standard/search pagination
   */
  allGroups?: Record<string, TData[]>;
};

/**
 * Reusable infinite scroll hook that combines react-query's useInfiniteQuery
 * with automatic scroll detection and pagination.
 *
 * @example
 * ```tsx
 * const { scrollContainerRef, allResults, isLoading } = useInfiniteScroll({
 *   queryKey: ['search', searchQuery],
 *   queryFn: ({ pageParam = 1 }) => searchApi({ query: searchQuery, page: pageParam }),
 * });
 *
 * return (
 *   <div ref={scrollContainerRef} style={{ height: '500px', overflow: 'auto' }}>
 *     {allResults.map(item => <Item key={item.id} data={item} />)}
 *     {isLoading && <div>Loading...</div>}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll<TData, TError = ApiError>(
  options: UseInfiniteScrollOptions<TData, TError>
): UseInfiniteScrollResult<TData, TError> {
  const { scrollConfig, mounted, ...queryOptions } = options;
  const scrollThreshold =
    scrollConfig?.scrollThreshold ?? InfiniteScrollConfigSchema.scrollThreshold;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const debouncedMounted = useDebounce(mounted, { wait: 2000 });

  const queryResult = useInfiniteQuery({
    ...queryOptions,
    getNextPageParam: (lastPage) => {
      // Handle responses with pagination metadata (SearchPaginatedResponse and GroupedPaginationResponse)
      if ('pagination' in lastPage && 'has_more' in lastPage.pagination) {
        if (!lastPage.pagination.has_more) {
          return undefined;
        }
        return lastPage.pagination.page + 1;
      }
      // Handle standard PaginatedResponse (total_pages)
      if ('pagination' in lastPage && 'total_pages' in lastPage.pagination) {
        if (lastPage.pagination.page >= lastPage.pagination.total_pages) {
          return undefined;
        }
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = queryResult;

  // Combine all pages - maintain both flattened and grouped structures
  const { allResults, allGroups } = useMemo(() => {
    if (!queryResult.data?.pages || queryResult.data.pages.length === 0) {
      return { allResults: [], allGroups: undefined };
    }

    const firstPage = queryResult.data.pages[0];

    // If first page has groups, merge all groups across pages
    if (firstPage && 'groups' in firstPage) {
      const mergedGroups: Record<string, TData[]> = {};

      for (const page of queryResult.data.pages) {
        if ('groups' in page) {
          for (const [groupKey, items] of Object.entries(page.groups)) {
            if (!mergedGroups[groupKey]) {
              mergedGroups[groupKey] = [];
            }
            mergedGroups[groupKey].push(...items);
          }
        }
      }

      // Also provide flattened version for convenience
      const flattened = Object.values(mergedGroups).flat();

      return { allResults: flattened, allGroups: mergedGroups };
    }

    // Otherwise, just flatten to array for standard pagination
    const flattened = queryResult.data.pages.flatMap((page) => {
      if ('data' in page) {
        return page.data;
      }
      return [];
    });

    return { allResults: flattened, allGroups: undefined };
  }, [queryResult.data]);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Trigger when user is within scrollThreshold pixels of the bottom
      if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollThreshold, debouncedMounted]);

  return {
    ...queryResult,
    scrollContainerRef,
    allResults,
    allGroups,
  };
}

type UseInfiniteScrollManualResult<TData, TError = ApiError> = UseInfiniteQueryResult<
  InfiniteData<PaginationResponse<TData>>,
  TError
> & {
  /**
   * Flattened array of all results from all pages
   * For grouped responses, this flattens all groups into a single array
   */
  allResults: TData[];
  /**
   * Grouped results when using grouped pagination
   * Undefined for standard/search pagination
   */
  allGroups?: Record<string, TData[]>;
};

export function useInfiniteScrollManual<TData, TError = ApiError>(
  queryOptions: UseInfiniteScrollOptions<TData, TError>
): UseInfiniteScrollManualResult<TData, TError> {
  const queryResult = useInfiniteQuery({
    ...queryOptions,
    getNextPageParam: (lastPage) => {
      // Handle responses with pagination metadata (SearchPaginatedResponse and GroupedPaginationResponse)
      if ('pagination' in lastPage && 'has_more' in lastPage.pagination) {
        if (!lastPage.pagination.has_more) {
          return undefined;
        }
        return lastPage.pagination.page + 1;
      }
      // Handle standard PaginatedResponse (total_pages)
      if ('pagination' in lastPage && 'total_pages' in lastPage.pagination) {
        if (lastPage.pagination.page >= lastPage.pagination.total_pages) {
          return undefined;
        }
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const { allResults, allGroups } = useMemo(() => {
    if (!queryResult.data?.pages || queryResult.data.pages.length === 0) {
      return { allResults: [], allGroups: undefined };
    }

    const firstPage = queryResult.data.pages[0];

    // If first page has groups, merge all groups across pages
    if (firstPage && 'groups' in firstPage) {
      const mergedGroups: Record<string, TData[]> = {};

      for (const page of queryResult.data.pages) {
        if ('groups' in page) {
          for (const [groupKey, items] of Object.entries(page.groups)) {
            if (!mergedGroups[groupKey]) {
              mergedGroups[groupKey] = [];
            }
            mergedGroups[groupKey].push(...items);
          }
        }
      }

      // Also provide flattened version for convenience
      const flattened = Object.values(mergedGroups).flat();

      return { allResults: flattened, allGroups: mergedGroups };
    }

    // Otherwise, just flatten to array for standard pagination
    const flattened = queryResult.data.pages.flatMap((page) => {
      if ('data' in page) {
        return page.data;
      }
      return [];
    });

    return { allResults: flattened, allGroups: undefined };
  }, [queryResult.data]);

  return {
    ...queryResult,
    allResults,
    allGroups,
  };
}
