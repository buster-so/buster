import first from 'lodash/first';
import React from 'react';
import type { FileType } from '@/api/asset_interfaces/chat';
import { useListVersionHistories } from '@/components/features/versionHistory';
import { useListVersionDropdownItems } from '@/components/features/versionHistory/useListVersionDropdownItems';
import { Button } from '@/components/ui/buttons';
import { Dropdown } from '@/components/ui/dropdown';
import { History } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';

export const VersionHistoryHeaderButtons = React.memo(() => {
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const {
    listItems,
    restoringVersion,
    isRestoringVersion,
    selectedQueryVersion,
    onClickRestoreVersion
  } = useListVersionHistories({
    assetId: selectedFile?.id || '',
    type: selectedFile?.type as 'metric' | 'dashboard'
  });

  const currentVersion = first(listItems)?.version_number;
  const isSelectedVersionCurrent = selectedQueryVersion === currentVersion;

  const onClickRestoreVersionPreflight = useMemoizedFn(async () => {
    if (selectedQueryVersion) {
      await onClickRestoreVersion(selectedQueryVersion);
    }
  });

  return (
    <div className="flex space-x-1.5">
      <VersionSelectButton
        selectedQueryVersion={selectedQueryVersion}
        listItems={listItems}
        chatId={chatId}
        fileId={selectedFile?.id || ''}
        fileType={selectedFile?.type as 'metric' | 'dashboard'}
      />
      <Button
        variant="black"
        disabled={isSelectedVersionCurrent || !currentVersion}
        onClick={onClickRestoreVersionPreflight}
        loading={isRestoringVersion}>
        Restore version
      </Button>
    </div>
  );
});

VersionHistoryHeaderButtons.displayName = 'VersionHistoryHeaderButtons';

const VersionSelectButton = React.memo(
  ({
    selectedQueryVersion,
    listItems,
    chatId,
    fileId,
    fileType
  }: {
    selectedQueryVersion: number | undefined;
    chatId: string | undefined;
    fileId: string;
    fileType: FileType;
    listItems: ReturnType<typeof useListVersionHistories>['listItems'];
  }) => {
    const versionHistoryItems = useListVersionDropdownItems({
      versions: listItems || [],
      selectedVersion: selectedQueryVersion,
      chatId: chatId,
      fileId: fileId,
      fileType: fileType,
      useVersionHistoryMode: true
    });

    return (
      <Dropdown items={versionHistoryItems} selectType="single" align="end" side="bottom">
        <Button
          variant="ghost"
          prefix={<History />}>{`Version ${selectedQueryVersion || 0}`}</Button>
      </Dropdown>
    );
  }
);

VersionSelectButton.displayName = 'VersionSelectButton';
