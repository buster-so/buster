'use client';

import type { FileType } from '@/api/asset_interfaces/chat';
import { useMount } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { CollapseFileButton } from './CollapseFileButton';
import { FileContainerHeaderVersionHistory } from './FileContainerHeaderVersionHistory';
import { SelectedFileButtonsRecord, SelectedFileSegmentRecord } from './config';

export const FileContainerHeader: React.FC = React.memo(() => {
  const selectedFileType = useChatLayoutContextSelector((x) => x.selectedFile?.type);
  const selectedFileId = useChatLayoutContextSelector((x) => x.selectedFile?.id);
  const isVersionHistoryMode = useChatLayoutContextSelector((x) => x.isVersionHistoryMode);

  if (isVersionHistoryMode) return <FileContainerHeaderVersionHistory />;

  return (
    <FileContainerHeaderStandard
      selectedFileId={selectedFileId}
      selectedFileType={selectedFileType}
    />
  );
});

FileContainerHeader.displayName = 'FileContainerHeader';

const FileContainerHeaderStandard: React.FC<{
  selectedFileId: string | undefined;
  selectedFileType: FileType | undefined;
}> = ({ selectedFileId, selectedFileType }) => {
  const router = useRouter();
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView);
  const onCollapseFileClick = useChatLayoutContextSelector((state) => state.onCollapseFileClick);
  const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
  const showCollapseButton = selectedLayout === 'both' || selectedLayout === 'chat-hidden';

  const SelectedFileSegment = React.useMemo(
    () =>
      selectedFileType && SelectedFileSegmentRecord[selectedFileType]
        ? SelectedFileSegmentRecord[selectedFileType]
        : () => null,
    [selectedFileType]
  );

  const SelectedFileButtons = React.useMemo(
    () =>
      selectedFileType && SelectedFileButtonsRecord[selectedFileType]
        ? SelectedFileButtonsRecord[selectedFileType]
        : () => null,
    [selectedFileType]
  );

  useMount(() => {
    if (chatId) {
      router.prefetch(
        createBusterRoute({
          route: BusterRoutes.APP_CHAT_ID,
          chatId
        })
      );
    }
  });

  return (
    <>
      <div className="flex min-w-0 shrink items-center gap-1.5 overflow-hidden">
        <CollapseFileButton
          showCollapseButton={showCollapseButton}
          onCollapseFileClick={onCollapseFileClick}
        />
        {selectedFileView && (
          <SelectedFileSegment
            selectedFileView={selectedFileView}
            selectedFileId={selectedFileId}
            chatId={chatId}
          />
        )}
      </div>
      <div className="flex flex-1 items-center justify-end">
        <SelectedFileButtons selectedFileView={selectedFileView} selectedFileId={selectedFileId} />
      </div>
    </>
  );
};
