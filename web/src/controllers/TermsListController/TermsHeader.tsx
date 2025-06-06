'use client';

import React, { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useGetTerm } from '@/api/buster_rest/terms';
import { NewTermModal } from '@/components/features/modal/NewTermModal';
import { Breadcrumb, type BreadcrumbItemType } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useUserConfigContextSelector } from '@/context/Users';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes } from '@/routes';

export const TermsHeader: React.FC<{
  termId?: string;
  openNewTermsModal?: boolean;
  setOpenNewTermsModal?: (open: boolean) => void;
}> = React.memo(({ termId, openNewTermsModal, setOpenNewTermsModal }) => {
  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const { data: term } = useGetTerm(termId);

  const onOpenNewTermsModal = useMemoizedFn(() => {
    setOpenNewTermsModal?.(true);
  });
  const onCloseNewTermsModal = useMemoizedFn(() => {
    setOpenNewTermsModal?.(false);
  });

  useHotkeys('t', onOpenNewTermsModal);

  return (
    <>
      <div className="flex w-full items-center justify-between space-x-1">
        <TermsBreadcrumb termName={term?.name} />

        <div className="flex items-center space-x-0">
          {isAdmin && (
            <AppTooltip title={'Create a new term'} shortcuts={['t']}>
              <Button onClick={onOpenNewTermsModal} prefix={<Plus />}>
                New term
              </Button>
            </AppTooltip>
          )}
        </div>
      </div>

      <NewTermModal open={!!openNewTermsModal} onClose={onCloseNewTermsModal} />
    </>
  );
});

TermsHeader.displayName = 'TermsHeader';

const TermsBreadcrumb: React.FC<{
  termName: string | undefined;
}> = React.memo(({ termName }) => {
  const items: BreadcrumbItemType[] = useMemo(
    () =>
      [
        {
          label: 'Terms',
          route: { route: BusterRoutes.APP_TERMS }
        },
        { label: termName }
      ].filter((item) => item.label) as BreadcrumbItemType[],
    [termName]
  );

  return <Breadcrumb items={items} />;
});
TermsBreadcrumb.displayName = 'TermsBreadcrumb';
