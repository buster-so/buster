import type React from 'react';
import { useRef } from 'react';
import {
  AppSplitter,
  type AppSplitterRef,
  type LayoutSize,
} from '@/components/ui/layouts/AppSplitter';
import { useIsEmbed } from '@/context/BusterAssets/useIsEmbed';
import { useGetCurrentMessageId, useIsStreamingMessage } from '@/context/Chats';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import type { LayoutMode } from '@/layouts/ChatLayout/config';
import { useSelectedAssetId } from '../../context/BusterAssets/useSelectedAssetType';
import { ChatContainer } from './ChatContainer';
import { useAutoChatSplitter } from './ChatLayoutContext/useAutoChatSplitter';
import { useAutoRedirectStreaming } from './ChatLayoutContext/useAutoRedirectStreaming';
import { useChatStreaming } from './ChatLayoutContext/useChatStreaming';
import {
  DEFAULT_CHAT_OPTION_SIDEBAR_SIZE,
  DEFAULT_FILE_OPTION_SIDEBAR_SIZE,
  MAX_CHAT_BOTH_SIDEBAR_SIZE,
} from './config';

interface ChatSplitterProps {
  children: React.ReactNode | null;
  initialLayout: LayoutSize;
  autoSaveId: string;
  defaultLayout: LayoutSize;
  selectedLayout: LayoutMode;
  isScreenshotMode?: boolean;
}

export const ChatLayout: React.FC<ChatSplitterProps> = ({
  initialLayout,
  autoSaveId,
  children,
  defaultLayout,
  selectedLayout,
  isScreenshotMode = false,
}) => {
  const appSplitterRef = useRef<AppSplitterRef>(null);
  const selectedAssetId = useSelectedAssetId();
  const currentMessageId = useGetCurrentMessageId() || '';
  const chatId = useGetChatId();
  const isEmbed = useIsEmbed();
  const isStreamingMessage = useIsStreamingMessage();

  const leftPanelMinSize = selectedAssetId ? DEFAULT_CHAT_OPTION_SIDEBAR_SIZE : '0px';
  const leftPanelMaxSize = selectedLayout === 'both' ? MAX_CHAT_BOTH_SIDEBAR_SIZE : undefined;
  const rightPanelMinSize = selectedAssetId ? DEFAULT_FILE_OPTION_SIDEBAR_SIZE : '0px';
  const rightPanelMaxSize = selectedLayout === 'chat-only' ? '0px' : undefined;
  const renderLeftPanel = selectedLayout !== 'file-only';
  const renderRightPanel = selectedLayout !== 'chat-only';

  useAutoRedirectStreaming({
    lastMessageId: currentMessageId,
    chatId,
  });
  useChatStreaming({ chatId, messageId: currentMessageId, isStreamingMessage });
  useAutoChatSplitter({ appSplitterRef });

  return (
    <AppSplitter
      ref={appSplitterRef}
      leftChildren={
        renderLeftPanel && (
          <ChatContainer chatId={chatId} isEmbed={isEmbed} isScreenshotMode={isScreenshotMode} />
        )
      }
      rightChildren={renderRightPanel && children}
      autoSaveId={autoSaveId}
      defaultLayout={defaultLayout}
      allowResize={selectedLayout === 'both'}
      preserveSide={'left'}
      leftPanelMinSize={leftPanelMinSize}
      leftPanelMaxSize={leftPanelMaxSize}
      rightPanelMinSize={rightPanelMinSize}
      rightPanelMaxSize={rightPanelMaxSize}
      initialLayout={initialLayout}
      rightPanelElement="div"
      leftPanelElement="div"
    />
  );
};

ChatLayout.displayName = 'ChatLayout';
