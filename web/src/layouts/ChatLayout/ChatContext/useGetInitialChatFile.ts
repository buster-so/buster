import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useGetChatMemoized, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat/chatMessageInterfaces';

export const useGetInitialChatFile = () => {
  const getChatMemoized = useGetChatMemoized();
  const getChatMessageMemoized = useGetChatMessageMemoized();

  const getInitialChatFileHref = useMemoizedFn(
    ({
      metricId,
      dashboardId,
      messageId,
      chatId,
      dashboardVersionNumber,
      metricVersionNumber,
      currentRoute
    }: {
      metricId: string | undefined;
      dashboardId: string | undefined;
      messageId: string | undefined;
      dashboardVersionNumber: number | undefined;
      metricVersionNumber: number | undefined;
      chatId: string;
      currentRoute: BusterRoutes;
    }): string | undefined => {
      const isChatOnlyMode = !metricId && !dashboardId && !messageId;
      if (isChatOnlyMode) {
        return;
      }

      const chat = getChatMemoized(chatId);

      //reasoning_message_mode
      if (messageId) {
        const messageExists = !!chat?.message_ids.some((id) => id === messageId);
        if (messageExists) {
          return;
        } else {
          return createBusterRoute({
            route: BusterRoutes.APP_CHAT_ID,
            chatId
          });
        }
      }

      //dashboard_mode
      if (dashboardId) {
        if (!dashboardVersionNumber) {
          const lastMatchingDashboardInChat = chat?.message_ids.reduce<
            BusterChatResponseMessage_file | undefined
          >((acc, chatMessageId) => {
            const chatMessage = getChatMessageMemoized(chatMessageId);

            chatMessage?.response_message_ids.forEach((responseMessageId) => {
              const message = chatMessage?.response_messages[responseMessageId]!;
              const isFile =
                message.type === 'file' &&
                message.file_type === 'dashboard' &&
                message.id === dashboardId;

              if (isFile) {
                acc = message;
              }
            });

            return acc;
          }, undefined);

          if (lastMatchingDashboardInChat) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_DASHBOARD_ID_VERSION_NUMBER,
              dashboardId: lastMatchingDashboardInChat.id,
              versionNumber: lastMatchingDashboardInChat.version_number,
              chatId
            });
          }
        } else {
          return;
        }
      }

      //metric_mode
      if (metricId) {
        const isChartRoute =
          currentRoute === BusterRoutes.APP_CHAT_ID_METRIC_ID_CHART ||
          currentRoute === BusterRoutes.APP_METRIC_ID_CHART;

        if (!metricVersionNumber && isChartRoute) {
          const lastMatchingMetricInChat = chat?.message_ids.reduce<
            BusterChatResponseMessage_file | undefined
          >((acc, chatMessageId) => {
            const chatMessage = getChatMessageMemoized(chatMessageId);

            chatMessage?.response_message_ids.forEach((responseMessageId) => {
              const message = chatMessage?.response_messages[responseMessageId]!;
              const isFile =
                message.type === 'file' &&
                message.file_type === 'metric' &&
                message.id === metricId;

              if (isFile) {
                acc = message;
              }
            });

            return acc;
          }, undefined);

          if (lastMatchingMetricInChat) {
            return createBusterRoute({
              route: BusterRoutes.APP_CHAT_ID_METRIC_ID_VERSION_NUMBER,
              metricId,
              versionNumber: lastMatchingMetricInChat.version_number,
              chatId
            });
          }
        } else {
          return;
        }
      }
    }
  );

  return getInitialChatFileHref;
};
