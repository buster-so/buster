'use client';

import { createContext, useContextSelector } from 'use-context-selector';
import React, { PropsWithChildren, useTransition } from 'react';
import { useMemoizedFn } from 'ahooks';
import type { AppSplitterRef } from '@/components/ui/layouts';
import { DEFAULT_CHAT_OPTION_SIDEBAR_SIZE } from './config';
import { useLayoutCollapse, useSelectedFileAndLayout } from '../hooks';
import { useChatFileLayout } from './useChatFileLayout';

interface UseChatSplitterProps {
  appSplitterRef: React.RefObject<AppSplitterRef | null>;
}

export const useChatLayout = ({ appSplitterRef }: UseChatSplitterProps) => {
  const animateOpenSplitter = useMemoizedFn((side: 'left' | 'right' | 'both') => {
    if (appSplitterRef.current) {
      const { animateWidth } = appSplitterRef.current;
      if (side === 'left') {
        animateWidth('100%', 'left');
      } else if (side === 'right') {
        animateWidth('100%', 'right');
      } else if (side === 'both') {
        //&& (isSideClosed('right') || isSideClosed('left'))
        animateWidth(DEFAULT_CHAT_OPTION_SIDEBAR_SIZE, 'left');
        setRenderViewLayoutKey('both');
        fileLayoutContext?.closeSecondaryView();
      }
    }
  });

  const {
    selectedFile,
    selectedLayout,
    chatId,
    onSetSelectedFile,
    setRenderViewLayoutKey,
    renderViewLayoutKey
  } = useSelectedFileAndLayout({ animateOpenSplitter });

  const { collapseDirection, isCollapseOpen, onCollapseFileClick } = useLayoutCollapse({
    selectedFile,
    selectedLayout,
    animateOpenSplitter
  });

  const fileLayoutContext = useChatFileLayout({
    selectedFileId: selectedFile?.id,
    selectedFileType: selectedFile?.type
  });

  return {
    ...fileLayoutContext,
    chatId,
    selectedLayout,
    renderViewLayoutKey,
    selectedFileType: selectedFile?.type,
    selectedFile,
    collapseDirection,
    isCollapseOpen,
    onCollapseFileClick,
    onSetSelectedFile,
    animateOpenSplitter
  };
};

const ChatLayoutContext = createContext<ReturnType<typeof useChatLayout>>(
  {} as ReturnType<typeof useChatLayout>
);

interface ChatLayoutContextProviderProps {}

export const ChatLayoutContextProvider: React.FC<
  PropsWithChildren<
    ChatLayoutContextProviderProps & {
      useChatLayoutProps: ReturnType<typeof useChatLayout>;
    }
  >
> = React.memo(({ children, useChatLayoutProps }) => {
  return (
    <ChatLayoutContext.Provider value={useChatLayoutProps}>{children}</ChatLayoutContext.Provider>
  );
});

ChatLayoutContextProvider.displayName = 'ChatLayoutContextProvider';

export const useChatLayoutContextSelector = <T,>(
  selector: (state: ReturnType<typeof useChatLayout>) => T
) => useContextSelector(ChatLayoutContext, selector);
