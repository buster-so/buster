'use client';

import React from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from './config';
import { useGetChatParams } from './useGetChatParams';
import { useLayoutConfig } from './useLayoutConfig';
import { useSelectedFile } from './useSelectedFile';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';

interface UseLayoutConfigProps {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
}

export const useChatLayoutContext = ({ appSplitterRef }: UseLayoutConfigProps) => {
  const chatParams = useGetChatParams();

  const animateOpenSplitter = useMemoizedFn((side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth, getSizesInPixels } = appSplitterRef.current;
      const sizes = getSizesInPixels();
      const leftSize = sizes[0] ?? 0;
      const rightSize = sizes[1] ?? 0;

      if (side === 'left') {
        animateWidth('100%', 'left');
      } else if (side === 'right') {
        animateWidth('100%', 'right');
      } else if (side === 'both') {
        const shouldAnimate = Number(leftSize) < 200 || Number(rightSize) < 340;

        if (!shouldAnimate) return;

        animateWidth(DEFAULT_CHAT_OPTION_SIDEBAR_SIZE, 'left');
        closeSecondaryView();
      }
    }
  });

  const { selectedFile, onSetSelectedFile } = useSelectedFile({
    animateOpenSplitter,
    chatParams,
    appSplitterRef
  });

  const {
    selectedFileView,
    selectedFileViewRenderSecondary,
    selectedFileViewSecondary,
    onSetFileView,
    closeSecondaryView,
    selectedLayout,
    onCollapseFileClick
  } = useLayoutConfig({
    ...chatParams,
    selectedFile,
    animateOpenSplitter,
    onSetSelectedFile,
    appSplitterRef
  });

  return {
    ...chatParams,
    selectedFileViewRenderSecondary,
    selectedFileView,
    selectedFileViewSecondary,
    onSetFileView,
    closeSecondaryView,
    selectedLayout,
    selectedFileType: selectedFile?.type,
    selectedFile,
    onCollapseFileClick,
    onSetSelectedFile,
    animateOpenSplitter
  };
};

const ChatLayoutContext = createContext<ReturnType<typeof useChatLayoutContext>>(
  {} as ReturnType<typeof useChatLayoutContext>
);

type ChatLayoutContextProviderProps = {
  children: React.ReactNode;
  chatLayoutProps: ReturnType<typeof useChatLayoutContext>;
};

export const ChatLayoutContextProvider: React.FC<ChatLayoutContextProviderProps> = (
  ({ children, chatLayoutProps }) => {
    return (
      <ChatLayoutContext.Provider value={chatLayoutProps}>{children}</ChatLayoutContext.Provider>
    );
  }
);

ChatLayoutContextProvider.displayName = 'ChatLayoutContextProvider';

export const useChatLayoutContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatLayoutContext>) => T
) => useContextSelector(ChatLayoutContext, selector);
