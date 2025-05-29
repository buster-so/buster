import dynamic from 'next/dynamic';
import type { MetricFileViewSecondary } from '@/layouts/ChatLayout/ChatLayoutContext/useLayoutConfig/interfaces';
import type { FileContainerSecondaryProps } from '../interfaces';
import { loading } from './loading';

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
  'version-history': ({ selectedFile }) => (
    <VersionHistoryPanel assetId={selectedFile?.id || ''} type="metric" />
  )
};
