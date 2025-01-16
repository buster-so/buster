import { ThreadContentController } from '@/app/app/_controllers/ThreadController';
import { AppAssetCheckLayout } from '@/app/app/_layouts';
import { getAppSplitterLayout } from '@/components/layout';
import React from 'react';

export default async function DashboardThreadPage({
  params: { threadId }
}: {
  params: {
    threadId: string;
  };
}) {
  const threadLayout = await getAppSplitterLayout('thread', ['auto', '360px']);

  return (
    <AppAssetCheckLayout threadId={threadId} type="thread">
      <ThreadContentController threadId={threadId} threadLayout={threadLayout} />
    </AppAssetCheckLayout>
  );
}
