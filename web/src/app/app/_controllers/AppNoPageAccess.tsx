'use client';

import { BusterShareAssetType } from '@/api/buster_rest';
import { asset_typeToTranslation } from '@/app/_helpers';
import { BusterLogo } from '@/assets/svg/BusterLogo';
import { Title } from '@/components/text';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { Button } from 'antd';
import Link from 'next/link';

import React from 'react';

export const AppNoPageAccess: React.FC<{
  asset_type: BusterShareAssetType;
  threadId?: string;
  dashboardId?: string;
}> = React.memo(({ asset_type, threadId, dashboardId }) => {
  const { openInfoMessage } = useBusterNotifications();

  return (
    <div className="flex h-[85vh] h-full w-full flex-col items-center justify-center space-y-6">
      <BusterLogo className="h-16 w-16" />

      <div className="max-w-[340px] text-center">
        <Title
          level={2}
          ellipsis={false}
          className="text-center">{`It looks like you don’t have access to this ${asset_typeToTranslation(asset_type)}.`}</Title>
      </div>

      <div className="flex space-x-2">
        <Button
          onClick={() => {
            openInfoMessage('Requesting access is not currently supported');
          }}>
          Request access
        </Button>
        <Link
          href={createBusterRoute({
            route: BusterRoutes.ROOT
          })}>
          <Button>Go back</Button>
        </Link>
      </div>
    </div>
  );
});

AppNoPageAccess.displayName = 'AppNoPageAccess';
