import { createFileRoute } from '@tanstack/react-router';
import { useSearchInfinite } from '@/api/buster_rest/search';

export const Route = createFileRoute('/app/_app/test-pagination')({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    scrollContainerRef,
    allResults,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  } = useSearchInfinite();

  return (
    <div
      className="p-4 max-h-[500px] overflow-y-auto border border-red-500"
      ref={scrollContainerRef}
    >
      <h1 className="text-2xl font-bold mb-4">Search Results</h1>

      {isLoading && <div>Loading...</div>}

      {allResults.length > 0 && (
        <div className="space-y-2 ">
          {allResults.map((result, index) => (
            <div key={`${result.assetId}-${index}`} className="p-4 border rounded">
              {JSON.stringify(result)}
            </div>
          ))}
          {isFetchingNextPage && (
            <div className="p-4 text-center text-gray-500">Loading more...</div>
          )}
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}

      {!hasNextPage && allResults.length > 0 && (
        <div className="mt-4 text-gray-500">No more results</div>
      )}
    </div>
  );
}
