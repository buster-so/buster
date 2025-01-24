import { BusterShareAssetType } from '@/api/buster_rest';
import { AppMaterialIcons } from '@/components';
import { useCollectionsContextSelector } from '@/context/Collections';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useAntToken } from '@/styles/useAntToken';
import { Button, Divider, Input, Space } from 'antd';
import React, { useMemo } from 'react';
import { Text } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const ShareMenuContentEmbed: React.FC<{
  publicExpirationDate: string;
  publicly_accessible: boolean;
  password: string | null;
  shareType: BusterShareAssetType;
  threadId?: string;
  dashboardId?: string;
  collectionId?: string;
}> = React.memo(
  ({
    publicExpirationDate,
    publicly_accessible,
    password,
    shareType,
    threadId,
    dashboardId,
    collectionId
  }) => {
    const token = useAntToken();
    const onShareDashboard = useDashboardContextSelector((state) => state.onShareDashboard);
    const onShareThread = useBusterThreadsContextSelector((state) => state.onShareThread);
    const onShareCollection = useCollectionsContextSelector((state) => state.onShareCollection);
    const { openSuccessMessage } = useBusterNotifications();

    const id = threadId || dashboardId || collectionId || '';

    const embedURL = useMemo(() => {
      let url = '';

      if (shareType === BusterShareAssetType.THREAD) {
        url = createBusterRoute({
          route: BusterRoutes.APP_THREAD_ID,
          threadId: id
        });
      }

      if (shareType === BusterShareAssetType.DASHBOARD) {
        url = createBusterRoute({
          route: BusterRoutes.APP_DASHBOARD_ID,
          dashboardId: id
        });
      }

      if (shareType === BusterShareAssetType.COLLECTION) {
        url = createBusterRoute({
          route: BusterRoutes.APP_COLLECTIONS_ID,
          collectionId: id
        });
      }

      return url + '?embed=true';
    }, [shareType, id]);

    const onCopyLink = useMemoizedFn(() => {
      const url = window.location.origin + embedURL;
      navigator.clipboard.writeText(url);
      openSuccessMessage('Link copied to clipboard');
    });

    const onPublish = useMemoizedFn(async () => {
      const payload = {
        id,
        publicly_accessible: true
      };

      if (shareType === BusterShareAssetType.THREAD) {
        await onShareThread(payload);
      } else if (shareType === 'dashboard') {
        await onShareDashboard(payload);
      } else if (shareType === 'collection') {
        await onShareCollection(payload);
      }
      openSuccessMessage('Succuessfully published');
    });

    return (
      <div className="flex flex-col">
        <div className="w-full p-3">
          <Space.Compact className="w-full">
            <Input className="!h-[24px]" value={createIframe(embedURL)} />
            <Button className="flex" type="default" onClick={onCopyLink}>
              <AppMaterialIcons icon="link" />
            </Button>
          </Space.Compact>

          <div className="flex justify-end">
            <Button
              icon={<AppMaterialIcons icon="data_object" />}
              type="default"
              className="mt-3"
              onClick={onCopyLink}>
              Copy code snippet
            </Button>
          </div>
        </div>

        <Divider />

        {!publicly_accessible && (
          <div
            className="flex justify-start overflow-hidden p-2 px-2.5"
            style={{
              background: token.controlItemBgHover,
              borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px `
            }}>
            <Text type="secondary" className="!text-xs">
              {`Your dashboard currently isn’t published.`}

              <span
                onClick={() => {
                  onPublish();
                }}
                className="ml-1 cursor-pointer"
                style={{
                  color: token.colorPrimary
                }}>
                Publish
              </span>
            </Text>
          </div>
        )}
      </div>
    );
  }
);
ShareMenuContentEmbed.displayName = 'ShareMenuContentEmbed';

const createIframe = (url: string) => {
  const newUrl = window.location.origin + url;

  return `<iframe src="${newUrl}" width="100%" height="100%" frameborder="0"></iframe>`;
};
