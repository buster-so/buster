import React from 'react';
import { getAppSplitterLayout } from '@/components/layout';
import { TermIndividualContainer } from './TermIndividualContainer';

export default async function TermIdPage({ params: { termId } }: { params: { termId: string } }) {
  const termPageIdLayout = await getAppSplitterLayout('term-page', ['auto', '300px']);

  return <TermIndividualContainer termPageIdLayout={termPageIdLayout} termId={termId} />;
}
