'use client';

import { FileType } from '@/api/asset_interfaces/chat';
import { RefObject, useMemo, useState } from 'react';
import { FileConfig, FileView, FileViewConfig, FileViewSecondary } from './interfaces';
import { useMemoizedFn, useUpdateEffect } from '@/hooks';
import { create } from 'mutative';
import { ChatLayoutView } from '../../interfaces';
import type { SelectedFile } from '../../interfaces';
import { timeout } from '@/lib/timeout';
import { BusterRoutes } from '@/routes/busterRoutes';
import { SelectedFileSecondaryRenderRecord } from '../../FileContainer/FileContainerSecondary';
import { ChatParams } from '../useGetChatParams';
import { initializeFileViews } from './helpers';
import { DEFAULT_FILE_VIEW } from '../helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';

export const useLayoutConfig = ({
  selectedFile,
  chatId,
  onSetSelectedFile,
  animateOpenSplitter,
  metricId,
  dashboardId,
  currentRoute,
  secondaryView,
  appSplitterRef
}: {
  selectedFile: SelectedFile | null;
  chatId: string | undefined;
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
  onSetSelectedFile: (file: SelectedFile | null) => void;
  appSplitterRef: RefObject<AppSplitterRef | null>;
} & ChatParams) => {
  const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const [fileViews, setFileViews] = useState<Record<string, FileConfig>>(() =>
    initializeFileViews({ secondaryView, metricId, dashboardId, currentRoute })
  );

  const selectedFileId = selectedFile?.id;
  const selectedFileType = selectedFile?.type;

  const selectedFileView: FileView | undefined = useMemo(() => {
    if (!selectedFileId) return undefined;
    return (
      fileViews[selectedFileId]?.selectedFileView || DEFAULT_FILE_VIEW[selectedFileType as FileType]
    );
  }, [fileViews, selectedFileId, selectedFileType]);

  const selectedFileViewConfig: FileViewConfig | undefined = useMemo(() => {
    if (!selectedFileId) return undefined;
    return fileViews[selectedFileId]?.fileViewConfig;
  }, [fileViews, selectedFileId]);

  const selectedFileViewSecondary: FileViewSecondary | null = useMemo(() => {
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return null;
    return selectedFileViewConfig?.[selectedFileView]?.secondaryView ?? null;
  }, [selectedFileViewConfig, selectedFileId, selectedFileView]);

  const selectedFileViewRenderSecondary: boolean = useMemo(() => {
    if (!selectedFileViewSecondary || !selectedFileType) return false;
    if (
      selectedFileType in SelectedFileSecondaryRenderRecord &&
      SelectedFileSecondaryRenderRecord[selectedFileType as FileType]?.[
        selectedFileViewSecondary
      ] !== undefined
    ) {
      return (
        SelectedFileSecondaryRenderRecord[selectedFileType as FileType]?.[
          selectedFileViewSecondary
        ] ?? false
      );
    }
    return true;
  }, [selectedFileViewConfig, selectedFileId, selectedFileView, selectedFileType]);

  const onSetFileView = useMemoizedFn(
    async ({
      fileView,
      fileId: fileIdProp,
      secondaryView
    }: {
      fileView?: FileView;
      fileId?: string | undefined;
      secondaryView?: FileViewSecondary;
    }) => {
      const fileId = fileIdProp ?? selectedFileId;
      if (!fileId) {
        onCollapseFileClick();
        return;
      }

      if (!chatId) {
        animateOpenSplitter('right');
      } else if (secondaryView) {
        animateOpenSplitter('right');

        //if the chat is open, we need to wait for the splitter to close before opening the secondary view
        const waitToOpen = !appSplitterRef.current?.isSideClosed('left') && chatId ? 250 : 0;
        await timeout(waitToOpen);
      } else if (chatId) {
        animateOpenSplitter('both');
      }

      setFileViews((prev) => {
        return create(prev, (draft) => {
          if (!draft[fileId]) {
            draft[fileId] = {
              selectedFileView: DEFAULT_FILE_VIEW[selectedFileType as FileType] || 'file',
              fileViewConfig: {}
            };
          }

          const usedFileView =
            fileView ??
            draft[fileId].selectedFileView ??
            DEFAULT_FILE_VIEW[selectedFileType as FileType];

          if (fileView !== undefined) {
            draft[fileId].selectedFileView = fileView;
          }

          if (secondaryView !== undefined) {
            if (!draft[fileId].fileViewConfig) {
              draft[fileId].fileViewConfig = {};
            }

            draft[fileId].fileViewConfig[usedFileView] = {
              ...(draft[fileId].fileViewConfig[usedFileView] || {}),
              secondaryView
            };
          }
        });
      });
    }
  );

  const closeSecondaryView = useMemoizedFn(async () => {
    if (!selectedFileId || !selectedFileViewConfig || !selectedFileView) return;
    setFileViews((prev) => {
      return create(prev, (draft) => {
        if (!draft[selectedFileId]?.fileViewConfig?.[selectedFileView]) return;
        draft[selectedFileId].fileViewConfig[selectedFileView].secondaryView = null;
      });
    });
    onChangeQueryParams({ secondary_view: null }, true);
    await timeout(250); //wait for the panel to close
  });

  const onCollapseFileClick = useMemoizedFn(async (navigateToChat: boolean = true) => {
    onSetSelectedFile(null);
    if (selectedFileViewSecondary) {
      closeSecondaryView();
    }
    if (navigateToChat && chatId) {
      onChangePage({
        route: BusterRoutes.APP_CHAT_ID,
        chatId
      });
    }
  });

  const selectedLayout: ChatLayoutView = useMemo(() => {
    if (chatId) {
      if (selectedFileViewSecondary) return 'chat-hidden';
      if (selectedFileId) return 'both';
      return 'chat-only';
    }
    return 'file-only';
  }, [selectedFileId, chatId, selectedFileViewSecondary]);

  //we need to use for when the user clicks the back or forward in the browser
  useUpdateEffect(() => {
    const newInitialFileViews = initializeFileViews({
      secondaryView,
      metricId,
      dashboardId,
      currentRoute
    });
    const fileId = Object.keys(newInitialFileViews)[0];
    const fileView = newInitialFileViews[fileId]?.selectedFileView;
    const secondaryViewFromSelected =
      newInitialFileViews[fileId]?.fileViewConfig?.[fileView]?.secondaryView;

    onSetFileView({
      fileId,
      fileView,
      secondaryView: secondaryViewFromSelected
    });
  }, [metricId, secondaryView, chatId, dashboardId, currentRoute]);

  return {
    selectedLayout,
    selectedFileView,
    selectedFileViewSecondary,
    selectedFileViewRenderSecondary,
    onSetFileView,
    closeSecondaryView,
    onCollapseFileClick
  };
};
