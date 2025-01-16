'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '../_components/AppContentHeader';
import { Breadcrumb, Button } from 'antd';
import { BreadcrumbProps } from 'antd/lib';
import { BreadcrumbSeperator } from '@/components';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useTermsIndividual, useTermsContextSelector } from '@/context/Terms';
import { AppMaterialIcons, AppTooltip } from '@/components';
import { NewTermModal } from './NewTermModal';
import { useHotkeys } from 'react-hotkeys-hook';
import { useUserConfigContextSelector } from '@/context/Users';

export const TermsHeader: React.FC<{ termId?: string }> = ({ termId }) => {
  const openNewTermsModal = useTermsContextSelector((x) => x.openNewTermsModal);
  const loadedTermsList = useTermsContextSelector((x) => x.loadedTermsList);
  const onSetOpenNewTermsModal = useTermsContextSelector((x) => x.onSetOpenNewTermsModal);

  const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
  const { term: selectedTerm } = useTermsIndividual({ termId });
  const showSkeletonLoader = termId ? !selectedTerm : !loadedTermsList;

  const items = useMemo<BreadcrumbProps['items']>(
    () =>
      [
        {
          title: (
            <Link
              suppressHydrationWarning
              className={`truncate`}
              href={createBusterRoute({ route: BusterRoutes.APP_TERMS })}>
              {'Terms'}
            </Link>
          )
        },
        {
          title: termId ? <>{selectedTerm?.name}</> : null
        }
      ].filter((v) => v.title),
    [termId, selectedTerm]
  );

  useHotkeys('t', () => {
    onSetOpenNewTermsModal(true);
  });

  return (
    <>
      <AppContentHeader>
        <div className="flex w-full items-center justify-between space-x-1">
          <Breadcrumb items={items} separator={<BreadcrumbSeperator />} />

          <div className="flex items-center space-x-0">
            {isAdmin && (
              <AppTooltip title={'Create a new term'} shortcuts={['t']}>
                <Button
                  onClick={() => {
                    onSetOpenNewTermsModal(true);
                  }}
                  icon={<AppMaterialIcons icon="add" />}>
                  New term
                </Button>
              </AppTooltip>
            )}
          </div>
        </div>
      </AppContentHeader>

      <NewTermModal open={openNewTermsModal} onClose={() => onSetOpenNewTermsModal(false)} />
    </>
  );
};
