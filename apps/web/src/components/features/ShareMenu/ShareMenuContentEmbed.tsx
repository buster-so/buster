import type { ShareAssetType } from '@buster/server-shared/share';
import type { BuildLocationFn, ParsedLocation } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import { useUpdateCollectionShare } from '@/api/buster_rest/collections';
import { useUpdateDashboardShare } from '@/api/buster_rest/dashboards';
import { useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { Button } from '@/components/ui/buttons';
import { Link } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/classMerge';
import type { ShareMenuContentBodyProps } from './ShareMenuContentBody';

export const ShareMenuContentEmbed: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({ className, embedLinkURL, onCopyLink }) => {
    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex w-full items-center space-x-1">
          <Input size="small" defaultValue={createIframe(embedLinkURL)} readOnly />
          <Button prefix={<Link />} className="flex" onClick={() => onCopyLink(true)} />
        </div>
      </div>
    );
  }
);
ShareMenuContentEmbed.displayName = 'ShareMenuContentEmbed';

const createIframe = (url: string) => {
  return `<iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>`;
};

export const ShareMenuContentEmbedFooter = ({
  assetId,
  assetType,
}: {
  assetId: string;
  assetType: ShareAssetType;
}) => {
  const { mutateAsync: onShareDashboard } = useUpdateDashboardShare();
  const { mutateAsync: onShareMetric } = useUpdateMetricShare();
  const { mutateAsync: onShareCollection } = useUpdateCollectionShare();
  const { openSuccessMessage } = useBusterNotifications();

  const onPublish = async () => {
    const payload: Parameters<typeof onShareMetric>[0] = {
      id: assetId,
      params: {
        publicly_accessible: true,
      },
    };
    if (assetType === 'metric_file') {
      await onShareMetric(payload);
    } else if (assetType === 'dashboard_file') {
      await onShareDashboard(payload);
    } else if (assetType === 'collection') {
      await onShareCollection(payload);
    }
    openSuccessMessage('Succuessfully published');
  };

  const text = useMemo(() => {
    if (assetType === 'metric_file') {
      return 'Your metric currently isn’t published.';
    } else if (assetType === 'dashboard_file') {
      return 'Your dashboard currently isn’t published.';
    } else if (assetType === 'chat') {
      return 'Your chat currently isn’t published.';
    } else if (assetType === 'report_file') {
      return 'Your report currently isn’t published.';
    } else {
      return 'Your item currently isn’t published.';
    }
  }, [assetType]);

  return (
    <div className="bg-item-hover flex justify-start overflow-hidden rounded-b px-3 py-2.5">
      <Text variant="secondary" className="text-xs!">
        {'Your dashboard currently isn’t published.'}

        <button
          type="button"
          onClick={() => {
            onPublish();
          }}
          className="text-primary ml-1 cursor-pointer"
        >
          Publish
        </button>
      </Text>
    </div>
  );
};
