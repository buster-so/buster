import {
  ThreadContentController,
  ThreadControllerHeader
} from '../../_controllers/ThreadController';
import { getAppSplitterLayout } from '@/components/layout';
import { AppAssetCheckLayout } from '../../_layouts/AppAssetCheckLayout';
import { AppContentHeader } from '../../_components/AppContentHeader';

export default async function ThreadsPage({
  params: { threadId },
  searchParams
}: {
  params: {
    threadId: string;
  };
  searchParams: { embed?: string };
}) {
  const threadLayout = await getAppSplitterLayout('thread', ['auto', '360px']);
  const embedView = searchParams.embed === 'true';

  return (
    <AppAssetCheckLayout threadId={threadId} type="thread">
      {!embedView && (
        <AppContentHeader>
          <ThreadControllerHeader threadId={threadId} />
        </AppContentHeader>
      )}
      <ThreadContentController
        threadLayout={threadLayout}
        threadId={threadId}
        chartOnlyView={embedView}
      />
    </AppAssetCheckLayout>
  );
}
