import React from 'react';
import { TermIndividualController } from '@/controllers/TermIndividualController';
import { getAppSplitterLayout } from '@/components/ui/layouts';

export default async function TermIdPage(props: { params: Promise<{ termId: string }> }) {
  const params = await props.params;

  const { termId } = params;

  const termPageIdLayout = getAppSplitterLayout('term-page', ['auto', '300px']);

  return <TermIndividualController termPageIdLayout={termPageIdLayout} termId={termId} />;
}
