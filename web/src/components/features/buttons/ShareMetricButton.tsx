import React from 'react';
import { ShareButton } from './ShareButton';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetMetric } from '@/api/buster_rest/metrics';
import { getShareAssetConfig } from '../ShareMenu/helpers';

export const ShareMetricButton = React.memo(({ metricId }: { metricId: string }) => {
  const { data: shareAssetConfig } = useGetMetric(
    { id: metricId },
    { select: getShareAssetConfig }
  );

  return (
    <ShareMenu
      shareAssetConfig={shareAssetConfig || null}
      assetId={metricId}
      assetType={ShareAssetType.METRIC}>
      <ShareButton />
    </ShareMenu>
  );
});

ShareMetricButton.displayName = 'ShareMetricButton';
