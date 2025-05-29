import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useStartChatFromAsset } from '@/api/buster_rest/chats/queryRequests';
import { Button } from '@/components/ui/buttons';
import { Stars } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib/timeout';
import { BusterRoutes } from '@/routes';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';

export const CreateChatButton = React.memo(
  ({ assetId, assetType }: { assetId: string; assetType: 'metric' | 'dashboard' }) => {
    const [loading, setLoading] = useState(false);
    const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
    const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
    const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

    const onCreateFileClick = useMemoizedFn(async () => {
      setLoading(true);
      try {
        const result = await startChatFromAsset({ asset_id: assetId, asset_type: assetType });

        if (assetType === 'metric') {
          await onChangePage({
            route: BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART,
            metricId: assetId,
            chatId: result.id
          });
        } else if (assetType === 'dashboard') {
          await onChangePage({
            route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID,
            dashboardId: assetId,
            chatId: result.id
          });
        }

        await timeout(250); //wait for the chat to load and the file to be selected
        onSetFileView({
          fileId: assetId,
          fileView: 'chart'
        });
      } catch (error) {
        //
      } finally {
        setLoading(false);
      }
    });

    useHotkeys('e', onCreateFileClick, { preventDefault: true });

    return (
      <AppTooltip title={'Start chat'} shortcuts={['e']} delayDuration={650}>
        <Button
          loading={isPending || loading}
          onClick={onCreateFileClick}
          variant="black"
          className="ml-1.5"
          prefix={<Stars />}>
          Start chat
        </Button>
      </AppTooltip>
    );
  }
);
CreateChatButton.displayName = 'CreateChatButton';
