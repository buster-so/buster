import type { ChatAssetType } from '@buster/server-shared/chats';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/buttons';
import { Stars } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';

export const CreateChatButton = React.memo(
  ({ assetId, assetType }: { assetId: string; assetType: ChatAssetType }) => {
    const { onCreateFileClick, loading } = useStartChatFromAsset({
      assetId,
      assetType,
    });

    useHotkeys('e', onCreateFileClick, { preventDefault: true });

    return (
      <AppTooltip title={'Edit with AI'} shortcuts={['e']} delayDuration={650}>
        <Button
          loading={loading}
          onClick={onCreateFileClick}
          variant="default"
          className="ml-1.5"
          prefix={<Stars />}
        >
          Edit with AI
        </Button>
      </AppTooltip>
    );
  }
);
CreateChatButton.displayName = 'CreateChatButton';
