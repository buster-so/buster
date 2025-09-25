import type React from 'react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useGetUserTeams } from '@/api/buster_rest/users/permissions';
import { LazyErrorBoundary } from '@/components/features/global/LazyErrorBoundary';
import { PermissionSearchAndListWrapper } from '@/components/features/permissions';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { UserTeamsListContainer } from './UserTeamsListContainer';

const NewTeamModal = lazy(() =>
  import('@/components/features/modals/NewTeamModal').then((mod) => ({ default: mod.NewTeamModal }))
);

export const UserTeamsController: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: teams, refetch } = useGetUserTeams({ userId });
  const [isNewTeamModalOpen, setIsNewTeamModalOpen] = useState(false);
  const { filteredItems, searchText, handleSearchChange } = useDebounceSearch({
    items: teams || [],
    searchPredicate: (item, searchText) => item.name.toLowerCase().includes(searchText),
  });

  const onCloseNewTeamModal = useMemoizedFn(() => {
    setIsNewTeamModalOpen(false);
    //HACK FOR NOW
    refetch();
  });

  const onOpenNewTeamModal = useMemoizedFn(() => {
    setIsNewTeamModalOpen(true);
  });

  const NewTeamButton: React.ReactNode = useMemo(() => {
    return (
      <Button prefix={<Plus />} onClick={onOpenNewTeamModal}>
        New team
      </Button>
    );
  }, []);

  return (
    <>
      <PermissionSearchAndListWrapper
        searchText={searchText}
        handleSearchChange={handleSearchChange}
        searchPlaceholder="Search by team name"
        searchChildren={NewTeamButton}
      >
        <UserTeamsListContainer filteredTeams={filteredItems} userId={userId} />
      </PermissionSearchAndListWrapper>

      <LazyErrorBoundary>
        <Suspense fallback={<span className="hidden">...</span>}>
          <NewTeamModal isOpen={isNewTeamModalOpen} onClose={onCloseNewTeamModal} />
        </Suspense>
      </LazyErrorBoundary>
    </>
  );
};
