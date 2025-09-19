import React from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { ShareMenu } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { ShareButton } from './ShareButton';

export const ShareMetricButton = React.memo(
  ({ metricId, cacheId }: { metricId: string; cacheId?: string }) => {
    const { data: shareAssetConfig } = useGetMetric(
      { id: metricId, cacheId },
      { select: getShareAssetConfig }
    );

    return (
      <ShareMenu
        shareAssetConfig={shareAssetConfig || null}
        assetId={metricId}
        assetType={'metric_file'}
      >
        <ShareButton />
      </ShareMenu>
    );
  }
);

ShareMetricButton.displayName = 'ShareMetricButton';
