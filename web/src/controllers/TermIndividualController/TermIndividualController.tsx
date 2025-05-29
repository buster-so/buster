'use client';

import type React from 'react';
import { useGetTermsList } from '@/api/buster_rest/terms';
import { AppPageLayout, AppSplitter } from '@/components/ui/layouts';
import { TermIndividualContent } from './TermIndividualContent';
import { TermIndividualContentSider } from './TermIndividualContentSider';
import { TermIndividualHeader } from './TermIndividualHeader';
import { TermIndividualHeaderSider } from './TermIndividualHeaderSider';

export const TermIndividualController: React.FC<{
  termPageIdLayout: string[];
  termId: string;
}> = ({ termPageIdLayout, termId }) => {
  const { isFetched: isFetchedTermsList } = useGetTermsList();

  return (
    <AppSplitter
      defaultLayout={termPageIdLayout}
      rightPanelMinSize={'280px'}
      rightPanelMaxSize={'400px'}
      autoSaveId="term-page"
      preserveSide="right"
      leftChildren={
        <>
          <TermIndividualHeader termId={termId} />
          <TermIndividualContent termId={termId} />
        </>
      }
      rightHidden={!isFetchedTermsList}
      rightChildren={
        <AppPageLayout header={<TermIndividualHeaderSider />}>
          <TermIndividualContentSider termId={termId} />
        </AppPageLayout>
      }
    />
  );
};
