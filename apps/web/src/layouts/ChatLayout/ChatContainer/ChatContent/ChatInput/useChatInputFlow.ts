import type React from 'react';
import { useMemo, useRef } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterNewChatContextSelector } from '@/context/Chats';
import { useMemoizedFn } from '@/hooks';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
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
  const isSubmittingChat = useBusterNewChatContextSelector((state) => state.isSubmittingChat);
  const onStartChatFromFile = useBusterNewChatContextSelector((state) => state.onStartChatFromFile);
  const onStopChatContext = useBusterNewChatContextSelector((state) => state.onStopChat);
  const currentMessageId = useChatIndividualContextSelector((x) => x.currentMessageId);
  const isFileChanged = useChatIndividualContextSelector((x) => x.isFileChanged);
  const onResetToOriginal = useChatIndividualContextSelector((x) => x.onResetToOriginal);
  const { openConfirmModal } = useBusterNotifications();

  const submittingCooldown = useRef(isSubmittingChat);

  const flow: FlowType = useMemo(() => {
    if (hasChat) return 'followup-chat';
    if (selectedFileType === 'metric' && selectedFileId) return 'followup-metric';
    if (selectedFileType === 'dashboard' && selectedFileId) return 'followup-dashboard';
    return 'new';
  }, [hasChat, selectedFileType, selectedFileId]);

  const onSubmitPreflight = useMemoizedFn(async () => {
    if (
      disableSubmit ||
      !chatId ||
      !currentMessageId ||
      submittingCooldown.current ||
      isSubmittingChat
    )
      return;

    if (loading) {
      onStopChat();
      return;
    }

    const trimmedInputValue = inputValue.trim();

    const method = async () => {
      submittingCooldown.current = true;
      switch (flow) {
        case 'followup-chat':
          await onFollowUpChat({ prompt: trimmedInputValue, chatId });
          break;

        case 'followup-metric':
          if (!selectedFileId) return;
          await onStartChatFromFile({
            prompt: trimmedInputValue,
            fileId: selectedFileId,
            fileType: 'metric'
          });
          break;
        case 'followup-dashboard':
          if (!selectedFileId) return;
          await onStartChatFromFile({
            prompt: trimmedInputValue,
            fileId: selectedFileId,
            fileType: 'dashboard'
          });
          break;

        case 'new':
          await onStartNewChat({ prompt: trimmedInputValue });
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

      setTimeout(() => {
        submittingCooldown.current = false;
      }, 350);
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
    setTimeout(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.select();
    }, 100);
  });

  return useMemo(
    () => ({ onSubmitPreflight, onStopChat, isFileChanged }),
    [onSubmitPreflight, onStopChat, isFileChanged]
  );
};
