import type { ShareAssetType, ShareConfig } from '@buster/server-shared/share';
import { type ParsedLocation, useRouter } from '@tanstack/react-router';
import React, { useMemo, useState } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { createFullURL } from '@/lib/routes';
import { getIsEffectiveOwner } from '@/lib/share';
import { ShareMenuContentBody } from './ShareMenuContentBody';
import { ShareMenuContentEmbedFooter } from './ShareMenuContentEmbed';
import { ShareMenuTopBar, ShareMenuTopBarOptions } from './ShareMenuTopBar';

export const ShareMenuContent: React.FC<{
  shareAssetConfig: ShareConfig;
  assetId: string;
  assetType: ShareAssetType;
}> = React.memo(({ assetId, assetType, shareAssetConfig }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const [selectedOptions, setSelectedOptions] = useState<ShareMenuTopBarOptions>(
    ShareMenuTopBarOptions.Share
  );

  const permission = shareAssetConfig?.permission;
  const publicly_accessible = shareAssetConfig?.publicly_accessible;
  const canEditPermissions = getIsEffectiveOwner(permission);
  const { buildLocation } = useRouter();

  const embedlinkUrl: string = useMemo(() => {
    let url: ParsedLocation | string = '';
    if (!assetId) {
      return '';
    }
    if (assetType === 'metric_file') {
      url = buildLocation({
        to: '/embed/metric/$metricId',
        params: {
          metricId: assetId,
        },
      });
    } else if (assetType === 'dashboard_file') {
      url = buildLocation({
        to: '/embed/dashboard/$dashboardId',
        params: {
          dashboardId: assetId,
        },
      });
    } else if (assetType === 'collection') {
      console.warn('collection is actually not supported for embeds...', assetId);
      url = buildLocation({
        to: '/app/chats/$chatId',
        params: {
          chatId: assetId,
        },
      });
    } else if (assetType === 'report_file') {
      url = buildLocation({
        to: '/embed/report/$reportId',
        params: {
          reportId: assetId,
        },
      });
    } else if (assetType === 'chat') {
      url = buildLocation({
        to: '/embed/chat/$chatId',
        params: {
          chatId: assetId,
        },
      });
    } else {
      const _exhaustiveCheck: never = assetType;
    }

    const urlWithDomain: string = createFullURL(url);
    return urlWithDomain;
  }, [assetId, assetType, buildLocation]);

  const linkUrl: string = useMemo(() => {
    let url: ParsedLocation | string = '';
    if (!assetId) {
      return '';
    }
    if (assetType === 'metric_file') {
      url = buildLocation({
        to: '/app/metrics/$metricId',
        params: {
          metricId: assetId,
        },
      });
    } else if (assetType === 'dashboard_file') {
      url = buildLocation({
        to: '/app/dashboards/$dashboardId',
        params: {
          dashboardId: assetId,
        },
      });
    } else if (assetType === 'collection') {
      url = buildLocation({
        to: '/app/collections/$collectionId',
        params: {
          collectionId: assetId,
        },
      });
    } else if (assetType === 'report_file') {
      url = buildLocation({
        to: '/app/reports/$reportId',
        params: {
          reportId: assetId,
        },
      });
    } else if (assetType === 'chat') {
      url = buildLocation({
        to: '/app/chats/$chatId',
        params: {
          chatId: assetId,
        },
      });
    }

    const urlWithDomain: string = createFullURL(url);
    return urlWithDomain;
  }, [assetId, buildLocation]);

  const onCopyLink = useMemoizedFn((isEmbed: boolean) => {
    navigator.clipboard.writeText(isEmbed ? embedlinkUrl : linkUrl);
    openSuccessMessage('Link copied to clipboard');
  });

  return (
    <div className="max-w-[340px] min-w-[340px]">
      {canEditPermissions && (
        <ShareMenuContentHeader
          assetType={assetType}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          onCopyLink={() => onCopyLink(false)}
          canEditPermissions={canEditPermissions}
        />
      )}

      <ShareMenuContentBody
        shareAssetConfig={shareAssetConfig}
        assetType={assetType}
        assetId={assetId}
        selectedOptions={selectedOptions}
        embedLinkURL={embedlinkUrl}
        onCopyLink={onCopyLink}
        canEditPermissions={canEditPermissions}
        className="px-3 py-2.5"
      />

      <ShareMenuContentFooter
        selectedOptions={selectedOptions}
        publicly_accessible={publicly_accessible}
        assetId={assetId}
        assetType={assetType}
      />
    </div>
  );
});
ShareMenuContent.displayName = 'ShareMenuContent';

const ShareMenuContentHeader = React.memo<{
  assetType: ShareAssetType;
  selectedOptions: ShareMenuTopBarOptions;
  setSelectedOptions: (options: ShareMenuTopBarOptions) => void;
  onCopyLink: () => void;
  canEditPermissions: boolean;
}>(({ assetType, selectedOptions, setSelectedOptions, onCopyLink, canEditPermissions }) => {
  return (
    <div className="border-b px-3 py-2">
      <ShareMenuTopBar
        assetType={assetType}
        selectedOptions={selectedOptions}
        onChangeSelectedOption={setSelectedOptions}
        onCopyLink={onCopyLink}
        canEditPermissions={canEditPermissions}
      />
    </div>
  );
});
ShareMenuContentHeader.displayName = 'ShareMenuContentHeader';

const ShareMenuContentFooter = React.memo<{
  selectedOptions: ShareMenuTopBarOptions;
  publicly_accessible: boolean;
  assetId: string;
  assetType: ShareAssetType;
}>(({ selectedOptions, publicly_accessible, assetId, assetType }) => {
  if (selectedOptions === ShareMenuTopBarOptions.Embed && !publicly_accessible) {
    return (
      <div className="border-t">
        <ShareMenuContentEmbedFooter assetId={assetId} assetType={assetType} />
      </div>
    );
  }

  return null;
});

ShareMenuContentFooter.displayName = 'ShareMenuContentFooter';
