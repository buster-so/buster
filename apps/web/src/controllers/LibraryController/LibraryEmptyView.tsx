import { useNavigate } from '@tanstack/react-router';
import { toggleLibrarySearch } from '@/components/features/search/LibrarySearchModal';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import type { LibraryViewProps } from './library.types';

export const LibraryEmptyView = ({ type }: { type: LibraryViewProps['type'] }) => {
  const navigate = useNavigate();
  return (
    <ListEmptyStateWithButton
      title={type === 'library' ? 'No library items found' : 'No shared items found'}
      description={
        type === 'library'
          ? 'You don’t have any library items. As soon as you do add some, they will start to  appear here.'
          : 'You don’t have any items that have been shared with you. As soon as you do add some, they will start to  appear here.'
      }
      buttonText="Start new chat"
      onClick={
        type === 'library'
          ? () => toggleLibrarySearch(true)
          : () => {
              navigate({
                to: '/app/home',
              });
            }
      }
    />
  );
};
