import React from 'react';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { ShareMenu } from '../ShareMenu';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { ShareButton } from './ShareButton';

export const ShareDashboardButton = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { data: dashboardResponse } = useGetDashboard(
    { id: dashboardId },
    { select: getShareAssetConfig }
  );

  return (
    <ShareMenu
      shareAssetConfig={dashboardResponse || null}
      assetId={dashboardId}
      assetType={'dashboard'}>
      <ShareButton />
    </ShareMenu>
  );
});

ShareDashboardButton.displayName = 'ShareDashboardButton';
