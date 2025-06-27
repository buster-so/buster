'use client';

import type React from 'react';
import { useGetTermsList } from '@/api/buster_rest/terms';
import { AppPageLayout } from '@/components/ui/layouts';
import { AppSplitter } from '@/components/ui/layouts/AppSplitter';
import { TermIndividualContent } from './TermIndividualContent';
import { TermIndividualContentSider } from './TermIndividualContentSider';
import { TermIndividualHeader } from './TermIndividualHeader';
import { TermIndividualHeaderSider } from './TermIndividualHeaderSider';

export const TermIndividualController: React.FC<{
  termPageIdDefaultLayout: string[];
  termId: string;
}> = ({ termPageIdDefaultLayout, termId }) => {
  const { isFetched: isFetchedTermsList } = useGetTermsList();

  return (
    <AppSplitter
      defaultLayout={termPageIdDefaultLayout}
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
        <AppPageLayout headerSizeVariant="default" header={<TermIndividualHeaderSider />}>
          <TermIndividualContentSider termId={termId} />
        </AppPageLayout>
      }
    />
  );
};
