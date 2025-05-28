import type React from 'react';
import { useMemo } from 'react';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useMemoizedFn } from '@/hooks';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { timeout } from '@/lib/timeout';

type FlowType = 'followup-chat' | 'followup-metric' | 'followup-dashboard' | 'new';

export const useChatInputFlow = ({
  disableSubmit,
  inputValue,
  setInputValue,
  textAreaRef,
  loading
}: {
  disableSubmit: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
  loading: boolean;
}) => {
  const hasChat = useChatIndividualContextSelector((x) => x.hasChat);
  const chatId = useChatIndividualContextSelector((x) => x.chatId);
  const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  const onStartNewChat = useBusterNewChatContextSelector((state) => state.onStartNewChat);
  const onFollowUpChat = useBusterNewChatContextSelector((state) => state.onFollowUpChat);
  const onStartChatFromFile = useBusterNewChatContextSelector((state) => state.onStartChatFromFile);
  const onStopChatContext = useBusterNewChatContextSelector((state) => state.onStopChat);
  const currentMessageId = useChatIndividualContextSelector((x) => x.currentMessageId);
  const isFileChanged = useChatIndividualContextSelector((x) => x.isFileChanged);
  const onResetToOriginal = useChatIndividualContextSelector((x) => x.onResetToOriginal);
  const { openConfirmModal } = useBusterNotifications();

  const flow: FlowType = useMemo(() => {
    if (hasChat) return 'followup-chat';
    if (selectedFileType === 'metric' && selectedFileId) return 'followup-metric';
    if (selectedFileType === 'dashboard' && selectedFileId) return 'followup-dashboard';
    return 'new';
  }, [hasChat, selectedFileType, selectedFileId]);

  const onSubmitPreflight = useMemoizedFn(async () => {
    if (disableSubmit || !chatId || !currentMessageId) return;

    if (loading) {
      onStopChat();
      return;
    }

    const method = async () => {
      switch (flow) {
        case 'followup-chat':
          await onFollowUpChat({ prompt: inputValue, chatId });
          break;

        case 'followup-metric':
          if (!selectedFileId) return;
          await onStartChatFromFile({
            prompt: inputValue,
            fileId: selectedFileId,
            fileType: 'metric'
          });
          break;
        case 'followup-dashboard':
          if (!selectedFileId) return;
          await onStartChatFromFile({
            prompt: inputValue,
            fileId: selectedFileId,
            fileType: 'dashboard'
          });
          break;

        case 'new':
          await onStartNewChat({ prompt: inputValue });
          break;

        default: {
          const _exhaustiveCheck: never = flow;
          return _exhaustiveCheck;
        }
      }

      setInputValue('');

      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 50);
    };

    if (!isFileChanged) {
      return method();
    }

    await openConfirmModal({
      title: 'Unsaved changes',
      content: 'Looks like you have unsaved changes. Do you want to save them before continuing?',
      primaryButtonProps: {
        text: 'Reset to original'
      },
      cancelButtonProps: {
        text: 'Continue'
      },
      onOk: async () => {
        onResetToOriginal();
        await timeout(25);
        method();
        return;
      },
      onCancel: async () => {
        method();
        return;
      }
    });
  });

  const onStopChat = useMemoizedFn(() => {
    if (!chatId) return;
    onStopChatContext({ chatId, messageId: currentMessageId });
    textAreaRef.current?.focus();
    textAreaRef.current?.select();
  });

  return useMemo(
    () => ({ onSubmitPreflight, onStopChat, isFileChanged }),
    [onSubmitPreflight, onStopChat, isFileChanged]
  );
};
