'use client';

import type React from 'react';
import { useMemo, useRef } from 'react';
import { AppSplitter, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { ChatContainer } from '../ChatContainer';
import { ChatContextProvider } from '../ChatContext/ChatContext';
import { ChatLayoutContextProvider, useChatLayoutContext } from '../ChatLayoutContext';
import {
  DEFAULT_CHAT_OPTION_SIDEBAR_SIZE,
  DEFAULT_FILE_OPTION_SIDEBAR_SIZE,
  MAX_CHAT_BOTH_SIDEBAR_SIZE
} from '../ChatLayoutContext/config';
import { FileContainer } from '../FileContainer';

interface ChatSplitterProps {
  children?: React.ReactNode;
}

export const ChatLayout: React.FC<ChatSplitterProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);

  const chatLayoutProps = useChatLayoutContext({ appSplitterRef });
  const { selectedLayout, selectedFile } = chatLayoutProps;

  const defaultSplitterLayout = useMemo(() => {
    if (selectedLayout === 'chat-only') return ['auto', '0px'];
    if (selectedLayout === 'file-only' || selectedLayout === 'chat-hidden') return ['0px', 'auto'];
    return ['380px', 'auto'];
  }, [selectedLayout]);

  const autoSaveId = `chat-splitter-${chatLayoutProps.chatId || '🫥'}-${chatLayoutProps.dashboardId || chatLayoutProps.metricId || '❌'}`;
  const leftPanelMinSize = selectedFile ? DEFAULT_CHAT_OPTION_SIDEBAR_SIZE : '0px';
  const leftPanelMaxSize = selectedLayout === 'both' ? MAX_CHAT_BOTH_SIDEBAR_SIZE : undefined;
  const rightPanelMinSize = selectedFile ? DEFAULT_FILE_OPTION_SIDEBAR_SIZE : '0px';
  const rightPanelMaxSize = selectedLayout === 'chat-only' ? '0px' : undefined;
  const renderLeftPanel = selectedLayout !== 'file-only';
  const renderRightPanel = selectedLayout !== 'chat-only';
  const secondaryFileView = chatLayoutProps.secondaryView;
  const mounted = true;

  const bustStorageOnInit = (preservedSideValue: number | null, containerSize: number) => {
    if (containerSize && !preservedSideValue) {
      return true;
    }
    return selectedLayout === 'chat-only' || selectedLayout === 'file-only' || !!secondaryFileView;
  };

  return (
    <ChatLayoutContextProvider chatLayoutProps={chatLayoutProps}>
      <ChatContextProvider>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={useMemo(() => mounted && <ChatContainer />, [mounted])}
          rightChildren={useMemo(
            () => mounted && <FileContainer>{children}</FileContainer>,
            [children, mounted]
          )}
          autoSaveId={autoSaveId}
          defaultLayout={defaultSplitterLayout}
          allowResize={selectedLayout === 'both'}
          preserveSide={'left'}
          leftPanelMinSize={leftPanelMinSize}
          leftPanelMaxSize={leftPanelMaxSize}
          rightPanelMinSize={rightPanelMinSize}
          rightPanelMaxSize={rightPanelMaxSize}
          renderLeftPanel={renderLeftPanel}
          renderRightPanel={renderRightPanel}
          bustStorageOnInit={bustStorageOnInit}
        />
      </ChatContextProvider>
    </ChatLayoutContextProvider>
  );
};

ChatLayout.displayName = 'ChatLayout';
