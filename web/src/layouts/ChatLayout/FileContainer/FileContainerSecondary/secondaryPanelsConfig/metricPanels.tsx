import dynamic from 'next/dynamic';
import { loading } from './loading';
import type { MetricFileViewSecondary } from '@/layouts/ChatLayout/ChatLayoutContext/useLayoutConfig/interfaces';
import type { FileContainerSecondaryProps } from '../interfaces';
import React from 'react';

const MetricEditController = dynamic(
  () =>
    import('@/controllers/MetricController/MetricViewChart/MetricEditController').then(
      (x) => x.MetricEditController
    ),
  { loading }
);
const VersionHistoryPanel = dynamic(
  () =>
    import('@/components/features/versionHistory/VersionHistoryPanel').then(
      (x) => x.VersionHistoryPanel
    ),
  { loading }
);

export const MetricSecondaryRecord: Record<
  MetricFileViewSecondary,
  React.FC<FileContainerSecondaryProps>
> = {
  'chart-edit': ({ selectedFile }) => <MetricEditController metricId={selectedFile?.id || ''} />,
  'sql-edit': ({ selectedFile }) => <></>, //because this is a vertical splitter, we don't want to render the sql edit view in the secondary view because it is vertical
  'version-history': ({ selectedFile }) => (
    <VersionHistoryPanel assetId={selectedFile?.id || ''} type="metric" />
  )
};

export const MetrucSecondaryRenderRecord: Partial<Record<MetricFileViewSecondary, boolean>> = {
  'sql-edit': false //we don't want to render the sql edit view in the secondary view because it is vertical
};
