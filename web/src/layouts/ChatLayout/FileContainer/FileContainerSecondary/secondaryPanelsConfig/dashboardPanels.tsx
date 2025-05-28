import type { DashboardFileViewSecondary } from '@/layouts/ChatLayout/ChatLayoutContext/useLayoutConfig';
import dynamic from 'next/dynamic';
import type { FileContainerSecondaryProps } from '../interfaces';
import { loading } from './loading';

const VersionHistoryPanel = dynamic(
  () =>
    import('@/components/features/versionHistory/VersionHistoryPanel').then(
      (x) => x.VersionHistoryPanel
    ),
  { loading }
);

export const DashboardSecondaryRecord: Record<
  DashboardFileViewSecondary,
  React.FC<FileContainerSecondaryProps>
> = {
  'version-history': ({ selectedFile }) => (
    <VersionHistoryPanel assetId={selectedFile?.id || ''} type="dashboard" />
  )
};
