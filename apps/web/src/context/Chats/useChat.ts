import type { MessageAnalysisMode } from '@buster/server-shared/chats';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { create } from 'mutative';
import type { FileType } from '@/api/asset_interfaces/chat';
import { useGetChatMemoized, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useStartNewChat, useStopChat } from '@/api/buster_rest/chats/queryRequestsV2';
import { useChatUpdate } from '@/api/buster_rest/chats/useChatUpdate';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { timeout } from '@/lib/timeout';

type StartChatParams = {
  prompt: string | undefined;
  datasetId?: string; //unused for now
  metricId?: string; //this is to start a NEW chat from a metric
  dashboardId?: string; //this is to start a NEW chat from a dashboard
  messageId?: string; //this is used to replace a message in the chat
  chatId?: string; //this is used to follow up a chat
  mode: MessageAnalysisMode; //ui modes
};

export const useChat = () => {
  const navigate = useNavigate();
  const { mutateAsync: startNewChatServerFn } = useStartNewChat();
  const { mutateAsync: stopChatMutation } = useStopChat();
  const getChatMemoized = useGetChatMemoized();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const { onUpdateChat, onUpdateChatMessage } = useChatUpdate();

  const { mutateAsync: startChat, isPending: isSubmittingChat } = useMutation({
    mutationFn: async ({
      prompt,
      chatId,
      metricId,
      dashboardId,
      messageId,
      mode,
    }: StartChatParams) => {
      const res = await startNewChatServerFn({
        prompt,
        chat_id: chatId,
        metric_id: metricId,
        dashboard_id: dashboardId,
        message_id: messageId,
        message_analysis_mode: mode,
      });

      const { message_ids, id } = res;

      const hasMultipleMessages = message_ids.length > 1;
      if (!hasMultipleMessages) {
        await navigate({
          to: '/app/chats/$chatId',
          params: { chatId: id },
        });
      }

      await timeout(150);
    },
  });

  const onStartNewChat = useMemoizedFn(
    async (d: { prompt: string; mode: StartChatParams['mode'] }) => {
      return startChat(d);
    }
  );

  const onStartChatFromFile = useMemoizedFn(
    async ({
      prompt,
      fileId,
      fileType,
      mode = 'auto',
    }: {
      prompt: string;
      fileId: string;
      fileType: FileType;
      mode?: StartChatParams['mode'];
    }) => {
      return startChat({
        prompt,
        metricId: fileType === 'metric_file' ? fileId : undefined,
        dashboardId: fileType === 'dashboard_file' ? fileId : undefined,
        mode,
      });
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({
      prompt,
      chatId,
      mode = 'auto',
    }: Pick<NonNullable<StartChatParams>, 'prompt' | 'chatId' | 'mode'>) => {
      return startChat({
        prompt,
        chatId,
        mode,
      });
    }
  );

  const onStopChat = useMemoizedFn(async ({ chatId }: { chatId: string }) => {
    return await stopChatMutation(chatId);
  });

  const onReplaceMessageInChat = useMemoizedFn(
    async ({
      prompt,
      messageId,
      chatId,
      mode = 'auto',
    }: {
      prompt: string;
      messageId: string;
      chatId: string;
      mode?: StartChatParams['mode'];
    }) => {
      const currentChat = getChatMemoized(chatId);
      const currentMessage = getChatMessageMemoized(messageId);
      const currentRequestMessage = currentMessage?.request_message;
      if (!currentRequestMessage) return;

      const messageIndex = currentChat?.message_ids.indexOf(messageId);

      onUpdateChatMessage({
        id: messageId,
        request_message: create(currentRequestMessage, (draft) => {
          draft.request = prompt;
        }),
        reasoning_message_ids: [],
        response_message_ids: [],
        reasoning_messages: {},
        final_reasoning_message: null,
      });

      if (messageIndex !== -1 && typeof messageIndex === 'number') {
        const updatedMessageIds = currentChat?.message_ids.slice(0, messageIndex + 1);
        onUpdateChat({
          id: chatId,
          message_ids: updatedMessageIds,
        });
      }

      return startChat({
        prompt,
        messageId,
        mode,
      });
    }
  );

  return {
    onStartNewChat,
    onStartChatFromFile,
    onFollowUpChat,
    onStopChat,
    onReplaceMessageInChat,
    isSubmittingChat,
  };
};
