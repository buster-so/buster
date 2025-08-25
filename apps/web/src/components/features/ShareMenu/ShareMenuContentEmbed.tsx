import React, { useMemo } from 'react';
import { ShareAssetType } from '@buster/server-shared/share';
import { useUpdateCollectionShare } from '@/api/buster_rest/collections';
import { useUpdateDashboardShare } from '@/api/buster_rest/dashboards';
import { useUpdateMetricShare } from '@/api/buster_rest/metrics';
import { useUpdateReportShare } from '@/api/buster_rest/reports';
import { Button } from '@/components/ui/buttons';
import { Link } from '@/components/ui/icons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { ShareMenuContentBodyProps } from './ShareMenuContentBody';

export const ShareMenuContentEmbed: React.FC<ShareMenuContentBodyProps> = React.memo(
  ({ className, assetType, assetId }) => {
    const { openSuccessMessage } = useBusterNotifications();

    const embedURL = useMemo(() => {
      let url = '';

      if (assetType === 'metric') {
        url = createBusterRoute({
          route: BusterRoutes.EMBED_METRIC_ID,
          metricId: assetId
        });
      }

      if (assetType === 'dashboard') {
        url = createBusterRoute({
          route: BusterRoutes.EMBED_DASHBOARD_ID,
          dashboardId: assetId
        });
      }

      if (assetType === 'report') {
        url = createBusterRoute({
          route: BusterRoutes.EMBED_REPORTS_ID,
          reportId: assetId
        });
      }

      return url;
    }, [assetType, assetId]);

    const onCopyLink = useMemoizedFn(() => {
      const url = window.location.origin + embedURL;
      navigator.clipboard.writeText(url);
      openSuccessMessage('Link copied to clipboard');
    });

    return (
      <div className={cn('flex flex-col', className)}>
        <div className="flex w-full items-center space-x-1">
          <Input size="small" defaultValue={createIframe(embedURL)} readOnly />
          <Button prefix={<Link />} className="flex" onClick={onCopyLink} />
        </div>
      </div>
    );
  }
);
ShareMenuContentEmbed.displayName = 'ShareMenuContentEmbed';

const createIframe = (url: string) => {
  const newUrl = window.location.origin + url;

  return `<iframe src="${newUrl}" width="100%" height="100%" frameborder="0"></iframe>`;
};

export const ShareMenuContentEmbedFooter = ({
  assetId,
  assetType
}: {
  assetId: string;
  assetType: ShareAssetType;
}) => {
  const { mutateAsync: onShareDashboard } = useUpdateDashboardShare();
  const { mutateAsync: onShareMetric } = useUpdateMetricShare();
  const { mutateAsync: onShareCollection } = useUpdateCollectionShare();
  const { mutateAsync: onShareReport } = useUpdateReportShare();
  const { openSuccessMessage } = useBusterNotifications();

  const onPublish = useMemoizedFn(async () => {
    const payload: Parameters<typeof onShareMetric>[0] = {
      id: assetId,
      params: {
        publicly_accessible: true
      }
    };
    if (assetType === 'metric') {
      await onShareMetric(payload);
    } else if (assetType === 'dashboard') {
      await onShareDashboard(payload);
    } else if (assetType === 'collection') {
      await onShareCollection(payload);
    } else if (assetType === 'report') {
      await onShareReport(payload);
    }
    openSuccessMessage('Successfully published');
  });

  return (
    <div className="bg-item-hover flex justify-start overflow-hidden rounded-b px-3 py-2.5">
      <Text variant="secondary" className="text-xs!">
        {'Your dashboard currently isn’t published.'}

        <button
          type="button"
          onClick={() => {
            onPublish();
          }}
          className="text-primary ml-1 cursor-pointer">
          Publish
        </button>
      </Text>
    </div>
  );
};
