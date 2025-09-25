import React from 'react';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { ShareMenu } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { ShareButton } from './ShareButton';

export const ShareMetricButton = React.memo(
  ({
    metricId,
    metricVersionNumber,
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
  }) => {
    const { data: shareAssetConfig } = useGetMetric(
      { id: metricId, versionNumber: metricVersionNumber },
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
