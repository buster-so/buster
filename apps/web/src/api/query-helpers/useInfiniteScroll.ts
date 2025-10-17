import type { PaginatedResponse, SearchPaginatedResponse } from '@buster/server-shared';
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
 * Pagination response types - supports both search and standard pagination
 */
type PaginationResponse<TData> = SearchPaginatedResponse<TData> | PaginatedResponse<TData>;

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
   */
  allResults: TData[];
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
      // Handle SearchPaginatedResponse (has_more)
      if ('has_more' in lastPage.pagination) {
        if (!lastPage.pagination.has_more) {
          return undefined;
        }
        return lastPage.pagination.page + 1;
      }
      // Handle PaginatedResponse (total_pages)
      if ('total_pages' in lastPage.pagination) {
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

  // Combine all pages into a single array of results
  const allResults = useMemo(
    () => queryResult.data?.pages.flatMap((page) => page.data) ?? [],
    [queryResult.data]
  );

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
  };
}
