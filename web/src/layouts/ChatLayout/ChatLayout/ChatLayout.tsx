'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { AppSplitter, type AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useLocalStorageState, useMount, useSessionStorageState } from '@/hooks';
import { CREATE_LANGFUSE_SESSION_URL } from '@/routes/externalRoutes';
import { ChatContainer } from '../ChatContainer';
import { ChatContextProvider } from '../ChatContext/ChatContext';
import { ChatLayoutContextProvider, useChatLayoutContext } from '../ChatLayoutContext';
import {
  DEFAULT_CHAT_OPTION_SIDEBAR_SIZE,
  DEFAULT_FILE_OPTION_SIDEBAR_SIZE
} from '../ChatLayoutContext/config';
import { FileContainer } from '../FileContainer';

interface ChatSplitterProps {
  children?: React.ReactNode;
}

const CHAT_SPLITTER_STORAGE_ID = 'chat-splitter';

const createCombinedId = (chatId: string | undefined, metricId: string | undefined) => {
  return (chatId || '') + (metricId || '');
};

export const ChatLayout: React.FC<ChatSplitterProps> = ({ children }) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);
  const { openErrorNotification } = useBusterNotifications();
  const [mounted, setMounted] = useState(false);

  const chatLayoutProps = useChatLayoutContext({ appSplitterRef });
  const { selectedLayout, selectedFile } = chatLayoutProps;
  const [previousSeenCombinedId, setPreviousSeenCombinedId] = useLocalStorageState<string | null>(
    `combined-id`,
    {
      defaultValue: null,
      bustStorageOnInit: false
    }
  );

  const defaultSplitterLayout = useMemo(() => {
    if (selectedLayout === 'chat-only') return ['auto', '0px'];
    if (selectedLayout === 'file-only' || selectedLayout === 'chat-hidden') return ['0px', 'auto'];
    return ['380px', 'auto'];
  }, [selectedLayout]);

  const autoSaveId = useMemo(() => {
    return 'chat-splitter';
  }, []);

  const bustStorageOnInit = useMemo(() => {
    return (
      createCombinedId(chatLayoutProps.chatId, chatLayoutProps.metricId) !== previousSeenCombinedId
    );
  }, []);

  useEffect(() => {
    setPreviousSeenCombinedId(createCombinedId(chatLayoutProps.chatId, chatLayoutProps.metricId));
  }, [chatLayoutProps.chatId, chatLayoutProps.metricId]);

  useMount(() => {
    setMounted(true); //we need to wait for the app splitter to be mounted because this is nested in the app splitter
  });

  useHotkeys(
    'meta+l',
    (e) => {
      e.stopPropagation();
      const chatId = chatLayoutProps.chatId;
      if (!chatId) {
        openErrorNotification('No chat id found');
        return;
      }
      const link = CREATE_LANGFUSE_SESSION_URL(chatId);
      window.open(link, '_blank');
    },
    {
      preventDefault: true
    }
  );

  return (
    <ChatLayoutContextProvider chatLayoutProps={chatLayoutProps}>
      <ChatContextProvider>
        <AppSplitter
          ref={appSplitterRef}
          leftChildren={useMemo(() => mounted && <ChatContainer mounted={mounted} />, [mounted])}
          rightChildren={useMemo(
            () => mounted && <FileContainer>{children}</FileContainer>,
            [children, mounted]
          )}
          autoSaveId={autoSaveId}
          defaultLayout={defaultSplitterLayout}
          allowResize={selectedLayout === 'both'}
          preserveSide="left"
          leftPanelMinSize={selectedFile ? DEFAULT_CHAT_OPTION_SIDEBAR_SIZE : '0px'}
          rightPanelMinSize={selectedFile ? DEFAULT_FILE_OPTION_SIDEBAR_SIZE : '0px'}
          bustStorageOnInit={bustStorageOnInit}
        />
      </ChatContextProvider>
    </ChatLayoutContextProvider>
  );
};

ChatLayout.displayName = 'ChatLayout';

const getCombinedId = (chatId: string, metricId: string) => {
  return chatId + metricId;
};
