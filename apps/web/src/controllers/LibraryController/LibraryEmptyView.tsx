import { toggleLibrarySearch } from '@/components/features/search/LibrarySearchModal';
import { ListEmptyStateWithButton } from '@/components/ui/list';

export const LibraryEmptyView = () => {
  return (
    <ListEmptyStateWithButton
      title="No library items found"
      description="You don’t have any library items. As soon as you do add some, they will start to  appear here."
      buttonText="Add items"
      onClick={() => {
        toggleLibrarySearch(true);
      }}
    />
  );
};
