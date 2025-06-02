'use client';

import { useMemo } from 'react';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitterOld';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { assetParamsToRoute } from '@/lib/assets';
import type { SelectedFile } from '../../interfaces';
import type { useGetChatParams } from '../useGetChatParams';
import { createSelectedFile } from './createSelectedFile';

export const useSelectedFile = ({
  animateOpenSplitter,
  appSplitterRef,
  chatParams
}: {
  animateOpenSplitter: (side: 'left' | 'right' | 'both') => void;
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
  chatParams: ReturnType<typeof useGetChatParams>;
}) => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const selectedFile: SelectedFile | null = useMemo(() => {
    return createSelectedFile(chatParams);
  }, [chatParams]);

  /**
   * @description Opens the splitter if the file is not already open.
   * If the file is already open, it will collapse the splitter.
   * You should do try to set the selected file with a Link!
   * @param file
   */
  const onSetSelectedFile = useMemoizedFn(async (file: SelectedFile | null) => {
    const handleFileCollapse = shouldCloseSplitter(file, selectedFile, appSplitterRef);

    if (file && chatParams.chatId) {
      const link = assetParamsToRoute({
        chatId: chatParams.chatId,
        assetId: file?.id,
        type: file?.type,
        versionNumber: file?.versionNumber
      });

      if (link) onChangePage(link);
    }

    if (handleFileCollapse) {
      animateOpenSplitter('left');
      return;
    }

    animateOpenSplitter('both');
  });

  return useMemo(
    () => ({
      onSetSelectedFile,
      selectedFile
    }),
    [onSetSelectedFile, selectedFile]
  );
};

export type SelectedFileParams = ReturnType<typeof useSelectedFile>;

const shouldCloseSplitter = (
  file: SelectedFile | null,
  selectedFile: SelectedFile | null,
  appSplitterRef: React.RefObject<AppSplitterRef | null>
): boolean => {
  if (!file) return true;
  if (file?.id === selectedFile?.id && !appSplitterRef.current?.isSideClosed('right')) {
    if (!!file?.versionNumber && !!selectedFile?.versionNumber) {
      return file.versionNumber === selectedFile.versionNumber;
    }
    return true;
  }
  return false;
};
